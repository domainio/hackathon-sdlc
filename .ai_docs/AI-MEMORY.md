# 🧠 Claude AI Memory - N8N.Local Project

## 📍 Project Context
**Directory**: `/Users/mlev/Projects/PERSONAL/AI/n8n.local/`  
**User**: ${CONTACT_EMAIL}  
**Project**: AI-powered multi-platform daily digest system using N8N, Claude API, monitoring stack

## 🎯 System Status (PRODUCTION READY)
✅ **All services operational** - 6 containers running optimally  
✅ **Claude API integrated** - Working in N8N workflows  
✅ **Monitoring configured** - Prometheus + Grafana + cAdvisor  
✅ **Documentation complete** - Setup guides and troubleshooting  
✅ **Resource optimized** - Memory limits preventing issues  

## 🔑 Critical Technical Knowledge

### Container Monitoring
- **cAdvisor uses `id` labels** not `name` - Query: `{id=~"/docker/.*"}`
- **N8N healthz returns JSON** not Prometheus metrics - Disabled in config
- **Dashboard reload**: `curl -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload`

### N8N Workflow Integration
- **Use `httpRequestTool`** not `httpRequest` for Claude API
- **Authentication**: `"nodeCredentialType": "anthropicApi"`
- **Method must be explicit**: `"method": "POST"`
- **Body format**: `"specifyBody": "json"`

### Resource Limits (Working)
- N8N: 512MB, Grafana: 256MB, Prometheus: 256MB, Redis: 128MB
- Current usage: ~375MB total of 1.4GB limit
- Health checks prevent cascading failures

## 🗂️ File Structure Memory
```
n8n.local/
├── docker-compose.yml          # Single consolidated config (KISS)
├── .env                        # All secrets (LastPass managed)
├── SETUP-WALKTHROUGH.md        # 380-line complete guide
├── MONITORING-DEBUG.md         # Troubleshooting steps
├── .ai_docs/                   # AI session memory (this dir)
├── workflows/                  # N8N workflow definitions
├── monitoring/                 # Prometheus + Grafana config
└── grafana/dashboards/         # Dashboard definitions
```

## 🔐 Credentials & Access
- **N8N**: http://localhost:5678 (${CONTACT_EMAIL})
- **Grafana**: http://localhost:3000 (admin/${GRAFANA_PASSWORD})
- **Claude API**: Working with LastPass-managed key
- **LastPass CLI**: Authenticated and integrated

## 🚨 Known Issues & Solutions
1. **Grafana dashboards no data**: Use `container_memory_usage_bytes{id=~"/docker/.*"}` queries
2. **N8N workflow 400 errors**: Ensure `httpRequestTool` node type
3. **Memory issues**: Resource limits already optimized and working

## ⚡ Quick Commands for Future Sessions
```bash
# System status
docker stats --no-stream

# Start/restart system  
docker-compose up -d
docker-compose restart prometheus grafana

# Test metrics
curl -s "http://localhost:9090/api/v1/query?query=container_memory_usage_bytes{id=~\"/docker/.*\"}"

# Reload dashboards
curl -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload
```

## 📋 Next Session Priorities
1. **Fix dashboard data display** - Apply working queries to all dashboards
2. **Test Gmail workflow** - Add OAuth credentials when provided
3. **Multi-platform digest** - Combine all workflow platforms

## 💡 AI Assistant Notes
- **User prefers direct action** over excessive explanation
- **Documentation is valuable** - Create guides during troubleshooting  
- **Resource optimization critical** - Monitor memory usage closely
- **KISS principle** - Consolidate configs, avoid duplication
- **Security first** - LastPass for all credential management

---
**🤖 This file helps Claude remember project state and technical decisions across sessions**