---
title: "Code Examples Across Languages"
date: "Feb 9, 2026"
tag: "Programming"
description: "A showcase of code examples in different programming languages to test syntax highlighting."
---

Here are some code examples in different languages to showcase syntax highlighting.

## Python

```python
def process_data(data: list[str], threshold: float = 0.5) -> dict:
    """Process a list of data points and return statistics."""
    results = {
        'count': len(data),
        'filtered': [x for x in data if x > threshold],
        'average': sum(data) / len(data) if data else 0
    }
    return results

# Example usage
data_points = [0.1, 0.7, 0.3, 0.9, 0.2]
stats = process_data(data_points, threshold=0.5)
print(f"Processed {stats['count']} items")
```

## JavaScript

```javascript
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        const user = await response.json();
        
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: new Date(user.createdAt)
        };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error(`User ${userId} not found`);
    }
}

// Usage with async/await
const user = await fetchUserData(123);
```

## Go

```go
package main

import (
    "fmt"
    "net/http"
    "encoding/json"
)

type User struct {
    ID        int    `json:"id"`
    Name      string `json:"name"`
    Email     string `json:"email"`
    CreatedAt string `json:"created_at"`
}

func GetUserHandler(w http.ResponseWriter, r *http.Request) {
    user := User{
        ID:    1,
        Name:  "Sagar Gaur",
        Email: "sagar@example.com",
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}
```

## SQL

```sql
-- Find users with recent activity
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(a.id) as activity_count,
    MAX(a.created_at) as last_activity
FROM users u
LEFT JOIN activities a ON u.id = a.user_id
WHERE a.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email
HAVING COUNT(a.id) > 10
ORDER BY last_activity DESC;
```

## TypeScript

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    preferences?: UserPreferences;
}

interface UserPreferences {
    theme: 'light' | 'dark';
    notifications: boolean;
}

class UserService {
    private users: Map<number, User> = new Map();
    
    async getUser(id: number): Promise<User | null> {
        if (this.users.has(id)) {
            return this.users.get(id)!;
        }
        return null;
    }
    
    async createUser(user: Omit<User, 'id'>): Promise<User> {
        const newUser: User = {
            id: Date.now(),
            ...user
        };
        this.users.set(newUser.id, newUser);
        return newUser;
    }
}
```

## Rust

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct User {
    id: u64,
    name: String,
    email: String,
}

impl User {
    fn new(id: u64, name: String, email: String) -> Self {
        User { id, name, email }
    }
    
    fn validate_email(&self) -> bool {
        self.email.contains('@') && self.email.contains('.')
    }
}

fn process_users(users: Vec<User>) -> HashMap<u64, User> {
    users
        .into_iter()
        .filter(|u| u.validate_email())
        .map(|u| (u.id, u))
        .collect()
}
```

## Bash

```bash
#!/bin/bash

# Process log files
LOG_DIR="/var/log/app"
OUTPUT_FILE="summary.txt"

echo "Processing logs from $LOG_DIR"

for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        echo "Processing: $log_file"
        grep -E "ERROR|WARN" "$log_file" >> "$OUTPUT_FILE"
    fi
done

echo "Summary written to $OUTPUT_FILE"
```
