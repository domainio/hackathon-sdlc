# 🧹 Workflow Cleanup & Organization Plan

## 🚨 **Current Mess Identified:**

### **Duplicates & Backups:**
- `gmail-digest.json` + `gmail-digest.json.backup` 
- `jira-digest.json` + `jira-digest.json.backup` + `jira-digest-consolidated.json` + `jira-digest-exported.json`
- Multiple AI dispatcher versions: 6 different files!

### **Old/Archived Files:**
- `archive/` folder with 14 old workflows
- `exports_20250617_193719/` - old exports
- Multiple trello versions

## 🎯 **Cleanup Strategy:**

### **Step 1: Identify PRODUCTION workflows (Keep These)**
- ✅ `gmail-digest.json` - Main Gmail processing
- ✅ `jira-digest.json` - Main Jira processing  
- ✅ `trello-digest.json` - Main Trello processing
- ✅ `unified-multi-platform-digest.json` - Combined workflow

### **Step 2: AI Dispatcher (Keep 1 ONLY)**
- ✅ `ai-model-dispatcher-service.json` - Core service (KEEP)
- ❌ Delete: `ai-dispatcher-simple-test.json`
- ❌ Delete: `ai-dispatcher-test-client.json` 
- ❌ Delete: `ai-model-dispatcher-demo-fixed.json`
- ❌ Delete: `ai-model-dispatcher-demo.json`
- ❌ Delete: `ai-multi-agent-dispatcher-service.json` (advanced - save for later)

### **Step 3: Remove Clutter**
- ❌ Delete: All `.backup` files
- ❌ Delete: All `-exported` files  
- ❌ Delete: `exports_20250617_193719/` folder
- ❌ Delete: `dummy.json`
- ❌ Keep: `archive/` folder (move more files here)

## 🎯 **Final Clean Structure:**

```
workflows/
├── README.md
├── gmail-digest.json              # PRODUCTION: Gmail automation
├── jira-digest.json               # PRODUCTION: Jira automation  
├── trello-digest.json             # PRODUCTION: Trello automation
├── unified-multi-platform-digest.json  # PRODUCTION: Combined
├── ai-model-dispatcher-service.json    # AI DISPATCHER: Core service
├── import-gtasks-to-trello.json   # UTILITY: Google Tasks import
├── archive/                       # OLD VERSIONS (safe to ignore)
└── scripts/                       # UTILITY SCRIPTS
```

## 🔧 **Grafana Dashboard Issues:**

### **Problem**: Dashboard import failures
### **Cause**: Likely datasource connection issues or JSON format problems

### **Fix Strategy:**
1. ✅ Check Prometheus datasource configuration
2. ✅ Verify dashboard JSON format  
3. ✅ Test with simple dashboard first
4. ✅ Import AI dispatcher dashboard last

## 📋 **Action Plan:**

1. **🧹 CLEANUP**: Remove duplicate/backup workflows (80% reduction)
2. **🔧 FIX**: Grafana datasource connections
3. **📥 IMPORT**: 4 production workflows to N8N 
4. **🧪 TEST**: One workflow end-to-end
5. **🚀 ENHANCE**: Add AI dispatcher when basic system works

**Goal**: Get from chaos to 4-5 working workflows + clean monitoring