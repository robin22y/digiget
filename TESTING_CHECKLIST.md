# Security & Functionality Testing Checklist

Use this checklist after implementing security fixes.

## 🔒 Security Tests

### Row-Level Security (RLS)
- [ ] **Test Shop Isolation**
  - Log in as Shop A owner
  - Try to query Shop B's customers: `SELECT * FROM customers WHERE shop_id = 'SHOP_B_ID'`
  - Expected: Returns 0 rows (empty)
  
- [ ] **Test Employee Access**
  - Log in as Shop A employee
  - Try to access Shop B's data
  - Expected: Access denied or empty results
  
- [ ] **Test Super Admin Access**
  - Log in as super admin (@digiget.uk)
  - Should be able to see ALL shops' data
  - Expected: Can see data from all shops

### Authentication
- [ ] **Unauthenticated Access**
  - Open app in incognito (not logged in)
  - Try to access `/dashboard/:shopId`
  - Expected: Redirected to login
  
- [ ] **Invalid Shop Access**
  - Log in as Shop A owner
  - Try to manually navigate to `/dashboard/SHOP_B_ID`
  - Expected: Access denied or redirect

### GPS Verification
- [ ] **Clock In Within Radius**
  - Be physically within shop radius
  - Clock in
  - Expected: Success
  
- [ ] **Clock In Outside Radius**
  - Be 200m+ away from shop
  - Try to clock in
  - Expected: Error message with distance
  
- [ ] **GPS Timeout**
  - Block GPS permission
  - Try to clock in
  - Expected: Friendly error message
  
- [ ] **GPS Bypass Attempt**
  - Try to modify location data in browser DevTools
  - Try to clock in
  - Expected: Server should reject (if server-side validation exists)

## ✅ Functionality Tests

### Customer Check-In
- [ ] **Normal Check-In**
  - Check in customer with phone number
  - Expected: Points added, visit recorded
  
- [ ] **Points Addition**
  - Check customer's points before
  - Check in customer
  - Verify points increased by correct amount
  
- [ ] **Days Between Points**
  - Check in customer
  - Immediately try to check in again
  - Expected: Error if days_between_points > 0

### Staff Clock-In/Out
- [ ] **Clock In**
  - Staff clocks in
  - Expected: Record created with location
  
- [ ] **Clock Out**
  - Staff clocks out
  - Expected: Duration calculated correctly
  
- [ ] **Double Clock In**
  - Clock in twice rapidly
  - Expected: Only one active entry, or error on second attempt

### Payroll
- [ ] **Payroll Calculation**
  - Create test clock entries
  - Generate payroll
  - Expected: Hours and pay calculated correctly
  
- [ ] **Payroll Export**
  - Export payroll as CSV
  - Expected: File downloads with correct data

### Forms & Validation
- [ ] **Phone Number Validation**
  - Enter invalid phone: "123"
  - Expected: Error message
  
- [ ] **Phone Number Formatting**
  - Enter "07123456789"
  - Expected: Formatted as "07123 456789"
  
- [ ] **Email Validation**
  - Enter invalid email: "notanemail"
  - Expected: Error message
  
- [ ] **XSS Prevention**
  - Enter `<script>alert('xss')</script>` in name field
  - Expected: Script tags stripped
  
- [ ] **SQL Injection Prevention**
  - Enter `'; DROP TABLE customers; --` in any field
  - Expected: Handled safely by parameterized queries

## 🛡️ Edge Case Tests

### Network Issues
- [ ] **Offline Mode**
  - Disconnect internet
  - Try to check in customer
  - Expected: Friendly error message
  
- [ ] **Slow Connection**
  - Throttle connection to "Slow 3G"
  - Use app normally
  - Expected: Loading states show, no crashes

### Double Actions
- [ ] **Double Click Prevention**
  - Rapidly click "Clock In" twice
  - Expected: Only one clock-in recorded
  
- [ ] **Form Double Submit**
  - Rapidly click "Save" twice
  - Expected: Only one save operation

### Data Edge Cases
- [ ] **Very Long Names**
  - Enter 200+ character name
  - Expected: Truncated or error shown
  
- [ ] **Special Characters**
  - Enter name: "O'Connor-Smith & Co."
  - Expected: Handled correctly
  
- [ ] **Empty Data**
  - Submit form with empty required fields
  - Expected: Validation errors

### Concurrent Operations
- [ ] **Two Staff Same Customer**
  - Two staff check in same customer simultaneously
  - Expected: Both succeed, points added correctly
  
- [ ] **Rapid Point Additions**
  - Rapidly check in same customer multiple times
  - Expected: Rate limiting or proper handling

## ⚡ Performance Tests

### Load Times
- [ ] **1000 Customers**
  - Load customers page with 1000+ customers
  - Expected: Loads in < 3 seconds
  
- [ ] **Payroll with 50 Staff**
  - Generate payroll for 50 staff members
  - Expected: Loads in < 5 seconds
  
- [ ] **Search Performance**
  - Search customers by phone/name
  - Expected: Results appear instantly (< 500ms)

### Memory
- [ ] **No Memory Leaks**
  - Use app for 30+ minutes
  - Check browser memory
  - Expected: Memory stable, no gradual increase
  
- [ ] **Component Cleanup**
  - Navigate between pages rapidly
  - Check console for errors
  - Expected: No subscription/interval errors

## 🐛 Error Handling Tests

### Error Messages
- [ ] **User-Friendly Errors**
  - Trigger various errors
  - Expected: Clear, actionable error messages
  
- [ ] **No Stack Traces**
  - Trigger errors
  - Check user-facing messages
  - Expected: No internal errors exposed

### Recovery
- [ ] **Error Recovery**
  - Trigger error
  - Fix the issue
  - Retry action
  - Expected: Works correctly after fix

## 📱 Mobile Tests

- [ ] **Mobile Responsiveness**
  - Test on phone/tablet
  - Expected: All features work on mobile
  
- [ ] **Touch Targets**
  - Click buttons on mobile
  - Expected: Easy to tap, no accidental clicks
  
- [ ] **GPS on Mobile**
  - Test clock-in on actual mobile device
  - Expected: GPS works correctly

## 🔍 Code Review Checklist

Before marking as complete, verify:

- [ ] All async functions have try/catch
- [ ] All useEffect hooks have cleanup
- [ ] All forms validate inputs
- [ ] All buttons have loading states
- [ ] All API calls use authenticated shop_id
- [ ] No hardcoded shop_ids in frontend
- [ ] No console.logs with sensitive data
- [ ] All errors use logger.error()
- [ ] All user-facing errors use getUserFriendlyError()

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All security tests pass
- [ ] SQL migration run successfully
- [ ] RLS policies verified
- [ ] No console errors in production build
- [ ] Error tracking configured (if applicable)
- [ ] Backup created before migration
- [ ] Rollback plan documented

