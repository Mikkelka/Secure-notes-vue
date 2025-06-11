# Session Timeout Testing Guide

## What Was Implemented

✅ **Auto Session Lock**: Automatically locks user out after 30 minutes of inactivity
✅ **Activity Tracking**: Tracks mouse, keyboard, scroll, and touch events
✅ **Warning Dialog**: Shows 2-minute countdown warning before timeout
✅ **Extend Session**: Button to extend session from warning dialog
✅ **Configurable Timeouts**: Environment variables for custom timeouts

## Quick Test (60 second timeout)

For quick testing, create a `.env.local` file in your project root:

```bash
# .env.local
VITE_SESSION_TIMEOUT=60000    # 60 seconds total
VITE_WARNING_TIME=20000       # 20 seconds warning
```

## Test Steps

### 1. **Test Normal Timeout**
1. Log in and unlock your app
2. **Don't interact** with the app for the configured time
3. **Expected**: Warning dialog appears 20 seconds before timeout
4. **Expected**: Auto-logout after full timeout

### 2. **Test Activity Reset**
1. Log in and unlock your app
2. **Move mouse or click** periodically
3. **Expected**: Timeout never occurs (activity resets timer)

### 3. **Test Warning Dialog**
1. Log in and unlock your app  
2. Wait for warning dialog to appear
3. **Click "Forlæng session"**
4. **Expected**: Warning disappears, timer resets

### 4. **Test Logout from Warning**
1. Log in and unlock your app
2. Wait for warning dialog to appear
3. **Click "Log ud nu"**
4. **Expected**: Immediate logout

### 5. **Test Auto-logout**
1. Log in and unlock your app
2. Wait for warning dialog to appear
3. **Don't click anything**
4. **Expected**: Auto-logout when countdown reaches 0

## Activity Events Tracked

The system tracks these user activities to reset the timer:
- `mousedown` - Mouse clicks
- `mousemove` - Mouse movement (throttled to every 5 seconds)
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch screen interaction
- `click` - Element clicks

## Production Configuration

For production, use longer timeouts in your environment:

```bash
# Production recommended
VITE_SESSION_TIMEOUT=1800000   # 30 minutes
VITE_WARNING_TIME=120000       # 2 minutes warning
```

## Default Values

If no environment variables are set:
- **Session Timeout**: 30 minutes (1,800,000 ms)
- **Warning Time**: 2 minutes (120,000 ms)

## Security Benefits

✅ **Prevents unauthorized access** if user leaves computer unlocked
✅ **Configurable timeouts** for different security requirements  
✅ **User-friendly warning** gives chance to extend session
✅ **Activity-based** - only locks during actual inactivity
✅ **Clean logout** - properly clears encryption keys and session data

## Console Logs

Watch browser console for debug information:
- "Session timeout - locking user out"
- "Showing session timeout warning"  
- Activity throttling messages

The session timeout system is now fully operational! 🔒