# 🔧 Monitoring Debug Guide

## Issue: Grafana Dashboards Show No Data

### Root Cause Analysis

**Problem**: Grafana dashboards are not displaying metrics data despite Prometheus and cAdvisor running.

### Debug Steps Performed

#### 1. Check Container Status
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```
✅ **Result**: All containers running normally
- N8N: 168MB/512MB (32.86%)
- Grafana: 73MB/256MB (28.44%)
- Prometheus: 41MB/256MB (16.07%)
- cAdvisor: 16MB/200MB (7.89%)

#### 2. Verify Prometheus Targets
```bash
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```
🔍 **Results**:
- ✅ **cadvisor**: UP - providing container metrics
- ✅ **prometheus**: UP - self-monitoring working
- ❌ **n8n**: DOWN - healthz endpoint returns JSON not Prometheus format

#### 3. Test cAdvisor Metrics
```bash
curl -s http://localhost:8080/metrics | grep container_memory | head -5
```
✅ **Result**: cAdvisor metrics available and properly formatted

#### 4. Check Grafana Data Sources
```bash
curl -s -u admin:${GRAFANA_PASSWORD} http://localhost:3000/api/datasources
```
✅ **Result**: Prometheus datasource configured correctly at http://prometheus:9090

### Issues Found & Fixes Applied

#### Issue 1: N8N Metrics Endpoint Format
**Problem**: N8N `/healthz` returns JSON health data, not Prometheus metrics
```json
{"status": "ok", "timestamp": "2025-06-14T08:44:22.000Z"}
```

**Fix**: Disabled N8N scraping in prometheus.yml since it doesn't provide Prometheus-format metrics
```yaml
# N8N health metrics (disabled - no Prometheus format)
# - job_name: 'n8n'
#   static_configs:
#     - targets: ['n8n:5678']
```

#### Issue 2: Dashboard Data Source Configuration
**Solution**: Verify dashboard queries use correct metric names

### Verification Commands

#### Check Prometheus Metrics Available
```bash
# List all available metrics
curl -s http://localhost:9090/api/v1/label/__name__/values | jq '.data[]' | grep container

# Test specific container memory query
curl -s "http://localhost:9090/api/v1/query?query=container_memory_usage_bytes" | jq '.data.result[] | {name: .metric.name, value: .value[1]}'

# Check container CPU usage
curl -s "http://localhost:9090/api/v1/query?query=rate(container_cpu_usage_seconds_total[5m])" | jq '.data.result[0]'
```

#### Test Grafana API
```bash
# Check datasource connection
curl -s -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/datasources/proxy/1/api/v1/query?query=up

# Reload dashboards
curl -s -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload
```

### Expected Metrics Available

#### From cAdvisor (Container Metrics)
- `container_memory_usage_bytes` - Memory usage per container
- `container_memory_limit_bytes` - Memory limits per container  
- `container_cpu_usage_seconds_total` - CPU usage per container
- `container_network_receive_bytes_total` - Network input
- `container_network_transmit_bytes_total` - Network output
- `container_fs_reads_bytes_total` - Disk reads
- `container_fs_writes_bytes_total` - Disk writes

#### From Prometheus (System Metrics)
- `prometheus_build_info` - Prometheus version info
- `prometheus_config_last_reload_successful` - Config status
- `prometheus_tsdb_symbol_table_size_bytes` - Storage usage

### Dashboard Configuration

#### Query Examples for Grafana Panels

**Memory Usage by Container**:
```promql
container_memory_usage_bytes{name!=""}
```

**CPU Usage Rate by Container**:
```promql
rate(container_cpu_usage_seconds_total{name!=""}[5m]) * 100
```

**Network I/O**:
```promql
rate(container_network_receive_bytes_total{name!=""}[5m])
rate(container_network_transmit_bytes_total{name!=""}[5m])
```

### Troubleshooting Steps

#### If Dashboards Still Show No Data

1. **Check Prometheus Data Retention**:
```bash
curl -s http://localhost:9090/api/v1/query?query=up
```

2. **Verify Time Range in Grafana**:
   - Set time range to "Last 5 minutes"
   - Use relative time, not absolute

3. **Test Individual Queries**:
   - Go to Prometheus UI: http://localhost:9090
   - Test queries manually in "Graph" tab

4. **Restart Services in Order**:
```bash
docker-compose restart prometheus
sleep 10
docker-compose restart grafana
sleep 5
curl -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload
```

### Dashboard Panel Configurations

#### Memory Usage Panel
```json
{
  "targets": [
    {
      "expr": "container_memory_usage_bytes{name!=\"\"}",
      "legendFormat": "{{name}}"
    }
  ]
}
```

#### CPU Usage Panel
```json
{
  "targets": [
    {
      "expr": "rate(container_cpu_usage_seconds_total{name!=\"\"}[5m]) * 100",
      "legendFormat": "{{name}}"
    }
  ]
}
```

### Current Status

✅ **Working**:
- Prometheus collecting cAdvisor metrics
- cAdvisor providing container metrics
- Grafana connected to Prometheus

❌ **Not Working**:
- N8N direct metrics (not available in Prometheus format)

🔧 **Solution**: Use cAdvisor container metrics to monitor N8N instead of direct N8N metrics.

### Next Steps

1. Restart Prometheus to apply config changes
2. Test dashboard queries in Prometheus UI
3. Verify dashboard panels use correct metric names
4. Set appropriate time ranges in Grafana

### Quick Fix Commands

```bash
# Restart monitoring stack
docker-compose restart prometheus grafana

# Wait for services to start
sleep 15

# Reload Grafana dashboards
curl -u admin:${GRAFANA_PASSWORD} -X POST http://localhost:3000/api/admin/provisioning/dashboards/reload

# Test metrics availability
curl -s "http://localhost:9090/api/v1/query?query=container_memory_usage_bytes" | jq '.data.result | length'
```

Expected result: Should return number > 0 indicating metrics are available.