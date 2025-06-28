# PostgreSQL Connection String Formats

Datagres supports all PostgreSQL connection string formats. This guide covers the most common variations and how to handle special cases.

## Supported Formats

### 1. Standard URL Format

The most common format for PostgreSQL connections:

```
postgresql://username:password@hostname:port/database
postgres://username:password@hostname:port/database
```

Examples:
```
postgresql://user:pass@localhost:5432/mydb
postgres://admin@db.example.com/production
postgresql://user@localhost/mydb?sslmode=require
```

### 2. Key-Value Pairs Format

PostgreSQL's native format using space-separated key=value pairs:

```
host=hostname port=5432 dbname=database user=username password=password
```

Examples:
```
host=localhost dbname=mydb user=admin
host=db.example.com port=5433 dbname=prod user=deploy password=secret
host=/var/run/postgresql dbname=mydb user=postgres
```

## Special Characters in Credentials

### URL Format
Special characters in usernames and passwords must be URL-encoded:

| Character | Encoded |
|-----------|---------|
| @         | %40     |
| :         | %3A     |
| /         | %2F     |
| ?         | %3F     |
| #         | %23     |
| space     | %20     |

Example with special characters:
```
postgresql://user:p@ssw0rd!@localhost/mydb
# Must be encoded as:
postgresql://user:p%40ssw0rd!@localhost/mydb
```

### Key-Value Format
For key-value format, quote values containing spaces or special characters:

```
host=localhost user=admin password='my pass@word'
host=localhost user=admin password="my pass@word"
```

## Common Connection String Variations

### 1. Default Port (5432)
```
# Port can be omitted if using default
postgresql://user:pass@localhost/mydb
# Equivalent to:
postgresql://user:pass@localhost:5432/mydb
```

### 2. SSL/TLS Configuration
```
# Require SSL
postgresql://user:pass@host/db?sslmode=require

# Disable SSL
postgresql://user:pass@host/db?sslmode=disable

# With certificates
postgresql://user:pass@host/db?sslmode=verify-full&sslcert=/path/to/cert&sslkey=/path/to/key
```

### 3. Connection Timeouts and Pooling
```
postgresql://user:pass@host/db?connect_timeout=30&pool_size=10
postgresql://user:pass@host/db?statement_timeout=5000&idle_in_transaction_session_timeout=10000
```

### 4. Application Name
```
postgresql://user:pass@host/db?application_name=myapp
```

### 5. IPv6 Addresses
IPv6 addresses must be enclosed in brackets:
```
postgresql://user:pass@[2001:db8::1]:5432/mydb
postgresql://user:pass@[::1]/mydb
```

### 6. Unix Domain Sockets
```
# URL format
postgresql:///mydb?host=/var/run/postgresql

# Key-value format
host=/var/run/postgresql dbname=mydb user=postgres
```

### 7. Multiple Hosts (Failover)
Some PostgreSQL drivers support multiple hosts for failover:
```
postgresql://user:pass@host1:5432,host2:5432/mydb
host=host1,host2 port=5432,5432 dbname=mydb user=admin
```

## Cloud Provider URLs

Datagres automatically detects and configures SSL for major cloud providers:

### AWS RDS
```
postgres://username:password@myinstance.abc123.us-east-1.rds.amazonaws.com:5432/mydb
```

### Heroku Postgres
```
postgres://username:password@ec2-1-2-3-4.compute-1.amazonaws.com:5432/d123abc
```

### Azure Database for PostgreSQL
```
postgres://username@servername:password@servername.postgres.database.azure.com/mydb
```

### Google Cloud SQL
```
postgresql://username:password@/mydb?host=/cloudsql/project:region:instance
```

## Connection String Validation

Datagres uses a permissive validation approach:
- Empty strings are rejected
- All other formats are passed to PostgreSQL for validation
- This ensures compatibility with all PostgreSQL connection parameters

## Security Notes

1. **Password Storage**: Passwords are stored separately in your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
2. **Connection Metadata**: Non-sensitive connection details are encrypted and stored locally
3. **Original Format Preservation**: Your exact connection string format is preserved for compatibility

## Troubleshooting

### "Invalid connection string format"
- Ensure the string is not empty
- Check for proper URL encoding of special characters
- Verify the format matches one of the supported patterns

### SSL/TLS Issues
- Cloud providers are auto-detected for SSL configuration
- For self-signed certificates, use `sslmode=require` or `sslmode=disable`
- Check your PostgreSQL server's SSL configuration

### Special Character Issues
- URL-encode special characters in URL format
- Use quotes for values with spaces in key-value format
- Test your connection string with `psql` command-line tool first