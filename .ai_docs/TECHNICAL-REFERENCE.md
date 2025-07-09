# 🔧 Technical Reference - Critical Knowledge Base

## 🎯 Quick System Access

### Service URLs
```bash
N8N Dashboard:    http://localhost:5678         (${N8N_USER})
Grafana:          http://localhost:3000         (admin/${GRAFANA_PASSWORD})
Prometheus:       http://localhost:9090         (no auth)
cAdvisor:         http://localhost:8080         (no auth)
Production N8N:   https://n8n.${DOMAIN_NAME}    (with SSL)
```

### Container Management
```bash
# System status
docker stats --no-stream
docker-compose ps

# Start/stop system
docker-compose up -d
docker-compose down

# View logs
docker-compose logs -f n8n
docker-compose logs -f grafana

# Restart specific service
docker-compose restart n8n
docker-compose restart prometheus grafana
```

## 🔍 Critical Technical Solutions

### 1. Monitoring Dashboard Data Fix
**Issue**: Grafana dashboards showing no data  
**Root Cause**: cAdvisor uses `id` labels, not `name` labels

**Working Queries**:
```promql
# Memory usage by container (ALL containers - shows data)
container_memory_usage_bytes

# Memory usage excluding root filesystem
container_memory_usage_bytes{id!="/"}

# CPU usage by container
rate(container_cpu_usage_seconds_total[5m]) * 100

# Network I/O
rate(container_network_receive_bytes_total[5m])
rate(container_network_transmit_bytes_total[5m])
```

**FIXED ISSUE**: Prometheus regex {id=~"/docker/.*"} fails due to shell escaping. Use simple queries without regex filtering.

**Dashboard Reload**:
```bash
curl -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload
```

### 2. N8N Claude API Integration
**Issue**: 400 Bad Request errors with Claude API  
**Solution**: Use correct node type and configuration

**Working N8N Node Configuration**:
```json
{
  "type": "n8n-nodes-base.httpRequestTool",
  "parameters": {
    "url": "https://api.anthropic.com/v1/messages",
    "method": "POST",
    "sendBody": true,
    "specifyBody": "json",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "anthropicApi"
  }
}
```

**Critical Requirements**:
- Use `httpRequestTool` NOT `httpRequest`
- Set `method: "POST"` explicitly
- Use `nodeCredentialType: "anthropicApi"`
- Set `specifyBody: "json"`

### 3. LastPass CLI Integration
**Commands**:
```bash
# Login
lpass login ${LASTPASS_USER}

# List credentials
lpass ls n8n-local/

# Get specific credential
lpass show "n8n-local/claude-api-key" --password

# Run secrets sync
./scripts/secrets-manager-simple.sh
```

**Credential Structure in LastPass**:
```
n8n-local/
├── claude-api-key
├── gmail-oauth-client-id
├── gmail-oauth-client-secret
├── slack-bot-token
└── jira-api-token
```

## 📊 Resource Optimization

### Current Container Limits (Optimized)
```yaml
n8n:
  memory: 512M      # Current: ~168MB (33%)
  cpus: '1.0'

grafana:
  memory: 256M      # Current: ~73MB (28%)
  cpus: '0.5'

prometheus:
  memory: 256M      # Current: ~41MB (16%)
  cpus: '0.5'

redis:
  memory: 128M      # Current: ~9MB (7%)
  cpus: '0.5'

cadvisor:
  memory: 200M      # Current: ~16MB (8%)
  cpus: '0.3'

nginx:
  memory: 64M       # Current: ~3MB (5%)
  cpus: '0.25'
```

### Performance Monitoring
```bash
# Real-time resource usage
docker stats

# Memory usage trend
curl -s "http://localhost:9090/api/v1/query?query=container_memory_usage_bytes{id=~\"/docker/.*\"}"

# CPU usage trend
curl -s "http://localhost:9090/api/v1/query?query=rate(container_cpu_usage_seconds_total{id=~\"/docker/.*\"}[5m])*100"
```

## 🔐 Security & Credentials

### Environment Variables (.env)
```bash
# Core Authentication
N8N_BASIC_AUTH_USER=${N8N_USER}
N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}

# API Keys (LastPass managed)
CLAUDE_API_KEY=sk-ant-api03-...
ANTHROPIC_API_KEY=sk-ant-api03-...

# Domain Configuration
N8N_EDITOR_BASE_URL=https://n8n.${DOMAIN_NAME}
WEBHOOK_URL=https://n8n.${DOMAIN_NAME}/
```

### API Key Management
```bash
# Test Claude API directly
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

## 🛠️ Workflow Debugging

### N8N Workflow Issues
**Common Problems & Solutions**:

1. **Sticky Node Error**: Remove sticky nodes from imported workflows
2. **Credential Not Found**: Add credentials in N8N dashboard first
3. **400 Bad Request**: Check node type (use httpRequestTool)
4. **Empty Response**: Verify API key and endpoint URL

### MCP Debugging (Available)
```bash
# Start MCP server for N8N debugging
python3 scripts/n8n-mcp-server.py

# Available MCP tools:
# - workflow_debug: Analyze execution logs
# - api_test: Test API endpoints
# - claude_integration: Validate Claude requests
# - workflow_export: Export workflow definitions
```

### Workflow File Locations
```bash
workflows/
├── claude-api-final-working.json    # ✅ WORKING Claude test
├── gmail-digest.json               # Gmail automation
├── slack-digest.json              # Slack monitoring
├── jira-digest.json               # Jira tracking
└── Multi-Platform-digest.json     # Combined workflow
```

## 🔄 System Maintenance

### Daily Health Checks
```bash
# Service status
docker-compose ps

# Resource usage
docker stats --no-stream

# Container logs (if issues)
docker-compose logs --tail=50 n8n
docker-compose logs --tail=50 grafana

# API connectivity test
curl -s http://localhost:5678/healthz
curl -s http://localhost:3000/api/health
```

### Weekly Maintenance
```bash
# Create backup
./backup-data.sh

# Check for updates
docker-compose pull

# Restart services
docker-compose restart

# Sync credentials
./scripts/secrets-manager-simple.sh
```

### Troubleshooting Commands
```bash
# Restart monitoring stack
docker-compose restart prometheus grafana
sleep 15
curl -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload

# Reset N8N data (DESTRUCTIVE)
docker-compose down
rm -rf n8n/
docker-compose up -d

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[]'

# Verify cAdvisor metrics
curl -s http://localhost:8080/metrics | grep container_memory | head -5
```

## 🌐 Domain & SSL Configuration

### Domain Setup (${DOMAIN_NAME})
```bash
# Current configuration
N8N_EDITOR_BASE_URL=https://n8n.${DOMAIN_NAME}
WEBHOOK_URL=https://n8n.${DOMAIN_NAME}/

# Required DNS records
n8n.${DOMAIN_NAME}    A    YOUR_SERVER_IP
n8n.${DOMAIN_NAME}    AAAA YOUR_IPV6 (optional)

# SSL certificate location
./nginx/ssl/${DOMAIN_NAME}.crt
./nginx/ssl/${DOMAIN_NAME}.key
```

### OAuth Callback URLs
```
Auth0: https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback
Gmail: https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback
Slack: https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback
```

## 📈 Performance Metrics

### Key Performance Indicators
- **System Uptime**: >99%
- **Memory Usage**: <70% of limits
- **API Response Time**: <2 seconds
- **Workflow Success Rate**: >95%
- **Container Restart Rate**: <1 per day

### Monitoring Queries
```bash
# Container uptime
curl -s "http://localhost:9090/api/v1/query?query=up"

# Memory usage percentage
curl -s "http://localhost:9090/api/v1/query?query=container_memory_usage_bytes/container_spec_memory_limit_bytes*100"

# API success rate (if configured)
curl -s "http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~\"2..\"}[5m])"
```

## 🚨 Emergency Procedures

### System Recovery
```bash
# Complete system restart
docker-compose down
docker system prune -f
docker-compose up -d

# Data recovery from backup
./restore-backup.sh BACKUP_DATE

# Emergency credential reset
lpass login ${LASTPASS_USER}
./scripts/secrets-manager-simple.sh
```

### Contact Information
- **User**: ${CONTACT_EMAIL}
- **Domain**: ${DOMAIN_NAME}
- **Project**: N8N.Local AI Digest System

---

**⚡ Quick Reference for Claude AI Sessions**

This file contains all critical technical knowledge needed to troubleshoot and maintain the N8N.Local system across sessions.