# Deploy QuizMaster to one EC2 instance

This is a low-cost, single-instance deployment helper for the current split-repository project. It builds the frontend and backend Docker images on your computer, launches one EC2 instance, uploads the images and environment file over SSH, and starts both containers behind Nginx. It does not create ECS, Fargate, ECR, an Application Load Balancer, a NAT Gateway, a database, or a domain.

The app is exposed over **HTTP at the EC2 public IPv4 address**. This is suitable for a short trial, not a secure production launch. Google/Firebase sign-in may also need the address added to Firebase Authentication's authorized domains. For production use, add HTTPS and a domain before sending real user credentials or data.

## Important Free Tier check

AWS documents EC2 Free Tier eligible instance types for accounts opened on or after July 15, 2025, including `t3.micro`, `t3.small`, `t4g.micro`, and `t4g.small`. A new Free account plan lasts six months or until its credits are exhausted, whichever comes first. Verify your plan, credits, remaining period, and EC2 eligibility in **Billing and Cost Management → Free Tier** before proceeding. See [EC2 Free Tier usage](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html) and [AWS Free account plan terms](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html).

The helper checks that the selected instance type is returned as eligible in the selected Region, but AWS's eligibility and billing dashboard is authoritative for your account. The helper creates a 12 GB encrypted disk and a public IPv4 address along with the EC2 instance; check the launch estimate and account usage first. Your public IP can change after stop/start. The EC2 console might display charges if your plan, credits, storage, or other account usage is outside its offer.

## One-time prerequisites

1. Install AWS CLI v2, Docker Desktop, and Windows OpenSSH. Start Docker Desktop.
2. Configure an AWS CLI identity with permissions to describe EC2 resources and create, start, stop, terminate, and inspect EC2 instances, security groups, and key pairs. The AWS CLI must be authenticated locally. Do not use root account access keys.
3. Keep the frontend and backend repositories side-by-side, like this:

   ```text
   PYTHON_QUIZ_APP/
   ├── my-app/
   └── flask-backend/
   ```

   The backend clone must be checked out beside `my-app`; this script does not clone repositories or change their branches.

## Fill in the private configuration

From the `my-app` directory, copy `deploy/ec2/.env.deploy.example` to `deploy/ec2/.env.deploy`. Fill all entries:

- Firebase web configuration (`NEXT_PUBLIC_FIREBASE_*`): from the Firebase project’s web app settings. These are public client configuration values and become part of the frontend bundle.
- `MONGODB_URI`: your MongoDB connection URI. Add the EC2 public IP to the MongoDB provider’s network allowlist after deployment if your provider requires it.
- `MONGODB_DB_NAME`: normally `quizapp` for this backend.
- `GROQ_API_KEY`: use a newly rotated key and keep it private.
- `SECRET_KEY`: a long, random Flask secret.
- `FIREBASE_CREDENTIALS_JSON`: the Firebase service-account JSON compacted onto one line. Keep escaped `\n` sequences in its `private_key` value.

The helper uploads `.env.deploy` to `/opt/quizmaster/.env` on the instance with owner-only file permissions. It does not print the backend secret values. The local file is ignored by Git; do not remove that protection or commit the file.

## Run the deployment

Open PowerShell in the `my-app` folder:

```powershell
Copy-Item .\deploy\ec2\.env.deploy.example .\deploy\ec2\.env.deploy
notepad .\deploy\ec2\.env.deploy
Set-ExecutionPolicy -Scope Process Bypass
.\deploy\ec2\deploy.ps1
```

Press Enter for the default Region `eu-west-1` and instance type `t3.small`, or enter another value shown as Free Tier eligible for your account. Enter your public IPv4 CIDR with `/32` when prompted for SSH access (for example, `203.0.113.25/32`). Review the prompts and type `DEPLOY` to authorize the AWS resource creation. When it finishes, open the printed `http://<public-ip>` address.

The script reuses its recorded instance on later runs, rebuilds the images, and replaces the containers. Keep `deploy/ec2/.keys/` and `.deployment-state.json` private and available; they let it reconnect to the instance. The script does not configure GitHub Actions CI/CD. The existing repository workflows still describe the earlier ECS deployment and must be replaced before using Actions for EC2 updates.

## Remove the AWS resources

From PowerShell, run `.deployec2destroy.ps1` and type `DELETE`. This terminates the instance, deletes its attached disk, security group, and AWS key-pair registration, and removes the local SSH private key and state file. Keep `.env.deploy` only if you still need the secrets locally; delete it securely when finished.
