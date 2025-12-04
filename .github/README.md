# GitHub Actions Workflows

## 🔄 CI/CD Pipelines cho API Repository

### 1. **CI Workflow** (`ci.yml`)
Chạy tự động khi:
- Push vào `main` hoặc `develop`
- Tạo Pull Request vào bất kỳ branch nào

**Stages:**
- ✅ Lint code với ESLint
- ✅ Build TypeScript
- ✅ Run tests với MySQL service
- ✅ Build Docker image
- ✅ Test Docker image

### 2. **Deploy Workflow** (`deploy.yml`)
Chạy tự động khi:
- Push vào `main` (production deploy)

**Steps:**
- 🚀 SSH vào VPS
- 📥 Pull latest code
- 🐳 Rebuild Docker containers
- ✅ Health check

## ⚙️ GitHub Secrets Cần Thiết

Vào `Settings > Secrets and variables > Actions` và thêm:

### Deploy Secrets:
```
SSH_HOST         = IP hoặc domain của VPS
SSH_USER         = username (vd: root, ubuntu)
SSH_KEY          = Private SSH key
SSH_PORT         = 22 (optional, default 22)
ENV_PRODUCTION   = Nội dung file .env production (optional)
```

### Docker Registry Secrets (Optional):
```
DOCKER_REGISTRY  = registry.example.com/your-org
DOCKER_USERNAME  = username
DOCKER_PASSWORD  = password/token
```

## 🔐 Generate SSH Key

Trên VPS:
```bash
# Generate key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Copy private key và paste vào GitHub Secret SSH_KEY
cat ~/.ssh/github-actions
```

## 📝 Customization

### Thay đổi branch trigger:
```yaml
on:
  push:
    branches:
      - main        # Chỉ main
      - develop     # Hoặc develop
      - 'release/*' # Hoặc release branches
```

### Thêm environment:
```yaml
jobs:
  deploy:
    environment: production  # Thêm protection rules
```

### Thêm notification (Slack, Discord):
```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment to production completed!"
      }
```

## 🐛 Troubleshooting

### Cache không hoạt động:
- Đảm bảo `package-lock.json` được commit
- Xóa cache cũ trong Settings > Actions > Caches

### SSH connection failed:
```bash
# Test SSH từ local
ssh -i ~/.ssh/github-actions user@vps-ip

# Check SSH service trên VPS
sudo systemctl status ssh
```

### Docker build failed:
- Check Dockerfile syntax
- Verify all COPY paths exist
- Check memory limits trên runner

### Tests failed:
- Check MySQL service health
- Verify environment variables
- Check test timeout settings

## 📊 Badge Status

Thêm vào README.md:
```markdown
![CI](https://github.com/your-org/nova-sites-api/workflows/API%20CI/badge.svg)
![Deploy](https://github.com/your-org/nova-sites-api/workflows/Deploy%20to%20Production/badge.svg)
```

