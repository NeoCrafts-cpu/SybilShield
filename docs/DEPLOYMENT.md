# SybilShield Deployment Guide

This guide covers deploying SybilShield to production environments.

## Prerequisites

- Node.js 18+ and pnpm 8+
- Leo CLI 3.4.0+ (for smart contracts)
- Access to Aleo testnet/mainnet
- Domain name and SSL certificates
- Cloud hosting account (Vercel, AWS, Railway, etc.)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/sybilshield/sybilshield.git
cd sybilshield
pnpm install
```

### 2. Configure Environment Variables

#### Relayer (.env)

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Aleo Configuration
ALEO_PRIVATE_KEY=your_aleo_private_key_here
ALEO_NETWORK=testnet
ALEO_API_URL=https://api.explorer.aleo.org/v1

# Smart Contract Addresses
SYBILSHIELD_CORE_PROGRAM=sybilshield_core.aleo
GOV_VOTE_PROGRAM=gov_vote.aleo

# Verification Providers
POH_API_URL=https://api.proofofhumanity.id
POH_API_KEY=your_poh_api_key
WORLDCOIN_APP_ID=your_worldcoin_app_id
WORLDCOIN_API_KEY=your_worldcoin_api_key

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://app.sybilshield.xyz
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_RELAYER_URL=https://api.sybilshield.xyz
NEXT_PUBLIC_ALEO_NETWORK=testnet
NEXT_PUBLIC_APP_URL=https://app.sybilshield.xyz
NEXT_PUBLIC_DEMO_MODE=false
```

## Smart Contract Deployment

### 1. Build Contracts

```bash
cd contracts
leo build
```

### 2. Deploy to Testnet

```bash
# Deploy sybilshield_core.aleo
snarkos developer deploy sybilshield_core.aleo \
  --private-key $ALEO_PRIVATE_KEY \
  --query "https://api.explorer.aleo.org/v1" \
  --priority-fee 1000000 \
  --broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast"

# Deploy gov_vote.aleo
snarkos developer deploy gov_vote.aleo \
  --private-key $ALEO_PRIVATE_KEY \
  --query "https://api.explorer.aleo.org/v1" \
  --priority-fee 1000000 \
  --broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast"
```

### 3. Initialize Programs

```bash
# Initialize sybilshield_core
snarkos developer execute sybilshield_core.aleo initialize \
  "your_admin_address" \
  --private-key $ALEO_PRIVATE_KEY \
  --query "https://api.explorer.aleo.org/v1" \
  --broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast"

# Initialize gov_vote
snarkos developer execute gov_vote.aleo initialize \
  "your_admin_address" \
  --private-key $ALEO_PRIVATE_KEY \
  --query "https://api.explorer.aleo.org/v1" \
  --broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast"
```

## Relayer Deployment

### Option A: Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy:

```bash
# Railway CLI
railway login
railway init
railway up
```

### Option B: AWS (EC2 + Docker)

1. Create an EC2 instance (t3.small recommended)
2. Install Docker:

```bash
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
```

3. Create Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

COPY relayer/ ./relayer/
WORKDIR /app/relayer
RUN pnpm build

EXPOSE 5000
CMD ["node", "dist/index.js"]
```

4. Build and run:

```bash
docker build -t sybilshield-relayer .
docker run -d -p 5000:5000 --env-file .env sybilshield-relayer
```

### Option C: Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sybilshield-relayer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sybilshield-relayer
  template:
    metadata:
      labels:
        app: sybilshield-relayer
    spec:
      containers:
      - name: relayer
        image: sybilshield/relayer:latest
        ports:
        - containerPort: 5000
        envFrom:
        - secretRef:
            name: sybilshield-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: sybilshield-relayer
spec:
  selector:
    app: sybilshield-relayer
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
```

## Frontend Deployment

### Vercel (Recommended)

1. Import project in Vercel dashboard
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy:

```bash
# Vercel CLI
cd frontend
vercel --prod
```

### Alternative: Static Export

```bash
cd frontend
pnpm build
# Output in .next/ directory

# Deploy to any static hosting:
# - AWS S3 + CloudFront
# - Cloudflare Pages
# - Netlify
```

## Domain and SSL Configuration

### DNS Records

```
A     app.sybilshield.xyz    → Frontend IP/CDN
A     api.sybilshield.xyz    → Relayer IP/LB
CNAME www.sybilshield.xyz    → app.sybilshield.xyz
```

### SSL Certificates

For production, use:
- **Let's Encrypt** (free, automated)
- **AWS ACM** (if using AWS)
- **Cloudflare** (if using Cloudflare)

### NGINX Configuration (if self-hosting)

```nginx
server {
    listen 443 ssl http2;
    server_name api.sybilshield.xyz;

    ssl_certificate /etc/letsencrypt/live/api.sybilshield.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sybilshield.xyz/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### Health Checks

```bash
# Relayer health check
curl https://api.sybilshield.xyz/health

# Expected response:
{
  "status": "ok",
  "timestamp": 1705000000000,
  "version": "1.0.0",
  "services": {
    "aleo": "connected",
    "poh": "connected",
    "worldcoin": "connected"
  }
}
```

### Logging (Winston → CloudWatch)

```javascript
// Already configured in relayer/src/utils/logger.ts
// Logs are JSON formatted for easy ingestion
```

### Metrics (Optional: Prometheus)

```typescript
// Add to relayer for metrics endpoint
import { collectDefaultMetrics, Registry } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
```

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables, not code
- [ ] HTTPS enforced everywhere
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak internal info

### Post-Deployment

- [ ] Penetration testing
- [ ] Smart contract audit
- [ ] Dependency vulnerability scan
- [ ] Backup private keys securely
- [ ] Monitor for unusual activity

## Backup and Recovery

### Critical Data

1. **Aleo Private Key**: Store in secure key management (AWS KMS, HashiCorp Vault)
2. **Database** (if added later): Regular backups
3. **Configuration**: Version controlled in git (secrets excluded)

### Recovery Procedure

1. Provision new infrastructure
2. Restore environment variables
3. Deploy contracts (or use existing deployed addresses)
4. Deploy relayer and frontend
5. Update DNS records
6. Verify health checks

## Troubleshooting

### Common Issues

**Relayer won't start**
```bash
# Check logs
docker logs sybilshield-relayer

# Verify environment variables
docker exec sybilshield-relayer env | grep ALEO
```

**Contract deployment fails**
```bash
# Check balance
snarkos developer scan --private-key $ALEO_PRIVATE_KEY

# Increase priority fee if needed
--priority-fee 2000000
```

**Frontend can't connect to relayer**
- Check CORS configuration
- Verify NEXT_PUBLIC_RELAYER_URL
- Check network tab for actual error

**Verification failing**
- Verify API keys for PoH/Worldcoin
- Check provider status pages
- Enable demo mode for testing

## Cost Estimation

### Monthly Costs (Estimated)

| Service | Provider | Cost |
|---------|----------|------|
| Frontend Hosting | Vercel Free | $0 |
| Relayer | Railway Starter | $5 |
| Domain | Namecheap | $1 |
| SSL | Let's Encrypt | $0 |
| Aleo Transactions | Variable | ~$10-50 |
| **Total** | | **~$16-56/month** |

### Scaling Costs

For high traffic, expect:
- Vercel Pro: $20/month
- Railway Pro: $20/month
- Load balancer: $20/month
- CDN: $10/month

## Support

For deployment issues:
- GitHub Issues: https://github.com/sybilshield/sybilshield/issues
- Discord: https://discord.gg/sybilshield
- Email: support@sybilshield.xyz
