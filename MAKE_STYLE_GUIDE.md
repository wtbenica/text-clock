# Text Clock - Make Output Style Guide

## **Standard Message Patterns**

### **1. Action Messages (what's about to happen):**
```
@echo "Building distribution package..."
@echo "Running tests..."
@echo "Installing extension..."
```

### **2. Completion Messages (successful outcome):**
```
@echo "Distribution package ready."
@echo "Tests completed successfully."
@echo "Extension installed successfully."
```

### **3. Error Messages (failures):**
```
echo "ERROR: yarn is required but not found" >&2; exit 1
echo "ERROR: TypeScript compilation failed" >&2; exit 1
```

### **4. Status Messages (informational):**
```
@echo "Current version: $(CURRENT_VERSION)"
@echo "Target version: $$new_version"
```

## **Standard Formatting Rules:**

1. **Action messages:** Start with verb, end with "..."
2. **Completion messages:** Past tense, end with "." 
3. **Error messages:** Start with "ERROR:", go to stderr, exit 1
4. **Status messages:** Simple present tense, end with "."
5. **All commands:** Use `@` prefix to hide command itself
6. **Tool output:** Suppress verbose output with `>/dev/null 2>&1` or `--quiet`

## **Examples to Fix:**

### **Before (inconsistent):**
```makefile
clean:
	@echo "Cleaning up..."
	@rm -rf $(DIST_DIR) || { echo "Removing dist directory failed"; exit 1; }
	@find . -name "*.zip" -print -exec rm -f {} \;
	@echo "Cleaning up complete."
```

### **After (consistent):**
```makefile  
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(DIST_DIR) >/dev/null 2>&1 || { echo "ERROR: Failed to remove dist directory" >&2; exit 1; }
	@find . -name "*.zip" -exec rm -f {} \; >/dev/null 2>&1
	@echo "Build artifacts cleaned."
```

## **Command Suppression:**

- **Yarn:** `yarn install --silent` instead of default verbose
- **Find:** `>/dev/null 2>&1` to suppress file lists  
- **Git:** `--quiet` flag where available
- **All commands:** Use `@` prefix consistently