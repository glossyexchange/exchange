module.exports = {
  apps: [{
    name: "API",
    script: "dist/server.js",          // ALWAYS run compiled JS
    instances: 1,                      // Adjust based on CPU cores
    exec_mode: "fork",                 // Use 'cluster' for multi-core
    watch: false,                      // Disable in production
    max_memory_restart: "500M",        // Auto-restart if memory > 500MB
    env: {
      NODE_ENV: "development",
      PORT: 3000
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3000
    },
    error_file: "logs/error.log",      // Error logs
    out_file: "logs/output.log",       // Standard output logs
    log_file: "logs/combined.log",     // Combined logs
    merge_logs: true,                  // Merge logs from all instances
    time: true                         // Add timestamps
  }]
}