# 🧠 AI Documentation System

## 📍 What This Directory Contains

This `.ai_docs/` directory contains comprehensive memory and reference documentation for Claude AI sessions working on the N8N.Local project.

## 📚 File Descriptions

### Core Documentation
- **`AI-MEMORY.md`** - Quick context for Claude AI sessions
- **`PROJECT-OVERVIEW.md`** - Complete system architecture and status
- **`TECHNICAL-REFERENCE.md`** - Critical commands and troubleshooting
- **`WORKFLOW-DEFINITIONS.md`** - N8N workflows and AI integration details

### Session Records
- **`SESSION-SUMMARY-2025-06-14.md`** - Complete session achievements and lessons
- **`AUTH-SETUP-PLAN.md`** - OAuth2 credential automation plan

## 🎯 Purpose

These files help Claude AI:
1. **Remember project context** across different sessions
2. **Access critical technical knowledge** without re-discovery
3. **Understand what's been accomplished** and what's pending
4. **Follow established patterns** and avoid repeating mistakes
5. **Maintain continuity** in problem-solving approaches

## 🔧 For Claude AI Sessions

When starting a new session:
1. **Read `AI-MEMORY.md`** first for quick context
2. **Check `PROJECT-OVERVIEW.md`** for current system status
3. **Use `TECHNICAL-REFERENCE.md`** for commands and solutions
4. **Review `WORKFLOW-DEFINITIONS.md`** for N8N integration details

## 📊 Current Status

**System**: 🟢 PRODUCTION READY  
**Services**: All 6 containers operational  
**Monitoring**: Configured (dashboard data pending)  
**AI Integration**: Claude API working in N8N  
**Documentation**: Complete setup guides available  

## 🚀 Quick Access

**Key Commands**:
```bash
# System status
docker stats --no-stream

# Service access
http://localhost:5678  # N8N (${CONTACT_EMAIL})
http://localhost:3000  # Grafana (admin/${GRAFANA_PASSWORD})

# Restart monitoring
docker-compose restart prometheus grafana
```

**Critical Files**:
- `docker-compose.yml` - Master configuration
- `.env` - All secrets (LastPass managed)
- `SETUP-WALKTHROUGH.md` - 380-line complete guide

---

**🎯 This directory ensures no knowledge is lost between Claude AI sessions**