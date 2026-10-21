# Scalable AWS deployment

This deployment is designed for a project walkthrough and interview demo. It runs the actual app as separate frontend and backend services, puts them behind an Application Load Balancer, and scales each ECS service independently.

## Project map and AWS services

| Project part | Current implementation | AWS/runtime service |
| --- | --- | --- |
| Frontend | Next.js 15, React, server-rendered app, Socket.IO client | ECS Fargate frontend service, private subnets |
| API and multiplayer | Flask, Gunicorn/eventlet, REST API and Socket.IO | ECS Fargate backend service, private subnets |
| Public entry point | `/api/*` and `/socket.io/*` go to Flask; other paths go to Next.js | Application Load Balancer, public subnets, health checks and sticky sessions for polling transport |
| Containers | Separate frontend and backend Docker images | Amazon ECR repositories |
| Multiplayer coordination | Room records and socket IDs are in MongoDB; cross-task Socket.IO messages use Redis | ElastiCache for Redis, private subnets, encrypted in transit and at rest, primary plus replica |
| Quiz history and rooms | MongoDB collections, including a room TTL index | Existing MongoDB Atlas account; allowlist the deployment NAT EIP |
| Sign-in | Firebase client SDK and Firebase Admin SDK | Existing Firebase project; admin JSON is in Secrets Manager |
| Quiz generation | Groq API | Existing Groq service; API key is in Secrets Manager |
| PDF upload | Files up to 5 MB are read and processed in memory | No S3 bucket is needed unless uploads must be retained |
| Delivery | Two independent GitHub repositories | GitHub Actions builds, pushes to ECR and updates the matching ECS service using short-lived GitHub OIDC credentials |
| Logs and scaling | Separate frontend/backend CPU target tracking | CloudWatch Logs/Container Insights and ECS Service Auto Scaling |

The frontend and backend each start at two tasks and scale independently. Each service has target tracking for average CPU near 60% and request count per target (1,000 requests/minute for frontend, 300 requests/minute for backend). The default maximum is six frontend tasks and ten backend tasks. Change the stack parameters to adjust those limits; tune the metric targets from load tests. Long-lived Socket.IO connections do not generate a request for every message, so CPU is the included signal for connection-heavy periods. The ALB health checks remove unhealthy tasks from traffic.

### About the Auto Scaling Group request

The included stack uses **ECS on Fargate**, so ECS Service Auto Scaling changes the number of frontend/backend tasks; there is no EC2 Auto Scaling Group in this design. Fargate is the simpler fit for two containerized services. If an interview specifically requires an EC2 Auto Scaling Group, the alternative is ECS on EC2 with an EC2 Auto Scaling Group capacity provider, plus ECS Service Auto Scaling for task counts. Those are two different scaling layers.

## Before you create anything

This is **not a Free Tier-only deployment**. It creates an Application Load Balancer, a NAT Gateway, four baseline Fargate tasks, a two-node Redis replication group, ECR, CloudWatch logs and supporting networking. These can incur ongoing charges even at low traffic. Set an AWS Budget alert first, choose a region, and delete the stack when you finish the demo. Confirm current prices in the AWS pricing pages for [ALB](https://aws.amazon.com/elasticloadbalancing/pricing/), [NAT Gateway](https://aws.amazon.com/vpc/pricing/) and [Fargate](https://aws.amazon.com/fargate/pricing/).

The template supports no-domain HTTP access through the ALB DNS name. This is useful for a short demo but is not a production security posture. For HTTPS, provide both a hostname and a valid ACM certificate in the same region. Firebase OAuth providers may require a verified HTTPS origin; add the final hostname to Firebase Authentication's authorized domains.

### 1. Prepare credentials and secrets

In AWS Secrets Manager, create five `SecretString` secrets and note each full ARN:

- MongoDB Atlas connection URI (include the `quizapp` database or keep the `MONGODB_DB_NAME=quizapp` default).
- Groq API key.
- Firebase service-account JSON object, stored as the complete JSON string.
- A long, random Flask `SECRET_KEY`.
- A random Redis auth token made of at least 32 hexadecimal characters. The hex format avoids URL escaping problems.

Do not commit these values to either repository. The six `NEXT_PUBLIC_FIREBASE_*` browser configuration values are public Firebase client configuration, not admin credentials; add them as GitHub **Actions variables** in the frontend repository.

### 2. Enable GitHub OIDC in AWS

Create the GitHub OIDC identity provider once per AWS account if it is not already present:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

The CloudFormation stack creates a deployment role limited to the configured repository and branch names. GitHub Actions assumes this role with OIDC; do not create long-lived AWS access keys for the workflow.

### 3. Create the platform stack

From the `my-app` repository directory, run this in PowerShell, replacing the region, AWS account ID, and five secret ARNs. Omit `DomainName` and `CertificateArn` for the no-domain HTTP demo. If you provide a certificate, also provide the hostname it covers.

```powershell
aws cloudformation deploy `
  --template-file deploy/aws/ecs-platform.yml `
  --stack-name quizmaster-demo `
  --region <your-region> `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
    MongoDbSecretArn=arn:aws:secretsmanager:<region>:<account-id>:secret:<mongodb-secret> `
    GroqApiKeySecretArn=arn:aws:secretsmanager:<region>:<account-id>:secret:<groq-secret> `
    FirebaseServiceAccountSecretArn=arn:aws:secretsmanager:<region>:<account-id>:secret:<firebase-secret> `
    AppSecretKeySecretArn=arn:aws:secretsmanager:<region>:<account-id>:secret:<flask-secret> `
    RedisAuthTokenSecretArn=arn:aws:secretsmanager:<region>:<account-id>:secret:<redis-token-secret>
```

To enable HTTPS, add `DomainName=<your-hostname>` and `CertificateArn=<matching-acm-certificate-arn>` to the parameter overrides.

Review the CloudFormation change set before approving it. The two ECS services initially have zero tasks so placeholder images are not run. The GitHub workflows deploy the real images and start two tasks per service.

After the stack completes, get the `NatGatewayEip` output and add that IP to MongoDB Atlas Network Access. This template uses one NAT Gateway to control the demo's networking footprint; for production high availability, use a NAT Gateway in each Availability Zone.

### 4. Configure both GitHub repositories

In **both** repositories (`shoryatyagi/A.I.-Quiz` and `shoryatyagi/flask-backend`), add these Actions repository variables:

- `DEPLOYMENT_TARGET` = `ecs`
- `AWS_REGION` = the stack's region
- `AWS_STACK_NAME` = `quizmaster-demo`
- `AWS_ROLE_ARN` = the `GitHubActionsRoleArn` stack output

In the frontend repository, also add these Actions variables from Firebase project settings:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

The workflow branches must match the stack parameters: frontend `develop`, backend `master`. Push to those branches (or run the workflow manually). Each workflow checks the code, builds its Docker image, pushes a commit-tagged image to ECR, registers a task definition and waits for ECS deployment stability. ECS Service Auto Scaling then adjusts task counts within the configured limits.

### 5. Open the app and review scaling

Use the stack's `AppUrl` output. For the HTTP demo URL, add its hostname to Firebase Authentication's authorized domains if your sign-in flow requires it. In the AWS console, review:

- **EC2 → Load Balancers → Target groups** for frontend/backend health.
- **ECS → Cluster → Services → Scaling** for desired, running and maximum task counts.
- **CloudWatch → Log groups → `/ecs/quizmaster-demo`** for container logs.
- **ElastiCache → Redis** for the Socket.IO queue status.

The backend now shares Socket.IO broadcasts across tasks via Redis and retrieves socket-to-room membership from MongoDB. Flask-SocketIO's deployment guidance requires both a shared message queue for room broadcasts and sticky sessions when polling transport is used; the template configures Redis and ALB target-group stickiness. See [Flask-SocketIO deployment guidance](https://flask-socketio.readthedocs.io/en/latest/deployment.html) and [AWS ECS target tracking](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-autoscaling-targettracking.html).

## Tear down after the demo

Delete the `quizmaster-demo` CloudFormation stack when you finish. ECR repositories retain pushed images unless you empty them first; the stack includes an image lifecycle policy, but empty the repositories before stack deletion if CloudFormation reports they are not empty. Keep the external MongoDB, Firebase and Groq accounts as configured; the stack does not create or delete those services.

## Limitations to explain in an interview

- Scaling uses average CPU and ALB request count, not request latency or active Socket.IO connection count. A production system may add a custom active-connection metric and tune scaling from load tests.
- The in-process connection rate limiter is per task, so it is not a global limit after scaling. Add AWS WAF rate-based rules or a shared Redis limiter before exposing this to untrusted high-volume traffic.
- The single NAT Gateway is a demo cost/availability tradeoff. Use one per Availability Zone for production resilience.
- This CloudFormation stack deploys infrastructure in one AWS account and region. It does not create a MongoDB Atlas, Firebase, or Groq account.
