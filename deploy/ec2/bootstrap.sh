#!/bin/bash
set -euo pipefail

# Single-instance setup only: no NAT gateway, load balancer, ECS, or ECR.
dnf install -y docker nginx
systemctl enable --now docker
systemctl enable --now nginx

rm -f /etc/nginx/conf.d/*.conf
cat >/etc/nginx/conf.d/quizmaster.conf <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 8m;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
nginx -t
systemctl reload nginx
mkdir -p /opt/quizmaster
chmod 700 /opt/quizmaster
touch /var/lib/cloud/instance/quizmaster-bootstrap.done
