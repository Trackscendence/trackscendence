### Failed Login Protection Policy and Documentation

This document defines the policy for users unsuccessfully attempt to login to an account.

#### Policy

Currently, for development, if a user failed to login with the wrong password 8 times, then they will be locked out of attempt login for 2 minutes. This is a purposely generous policy to make testing easy.

If we wanted to take the website live, we would lower the attempts to 5 and increase the minutes locked out to 10 or 15 minutes; or whatever seems reasonable.

#### Invalid Username

The User model is used for tracking password attempts, so the username must be known. However, we are implementing Rate-Limiting, which I would argue covers the invalid usernames. 

#### Code Description

The User model tracks login attempts, which is kept in `/src/server/prisma/schema.prisma`. The property is called `failedLoginAttempts`. If the value of this property equals or exceeds `MAX_LOGIN_ATTEMPTS` then the user attempting to login will be temporarly blocked from logging in until `LOCK_DURATION_MINUTES` minutes have counted down.

The User model can store the timestamp at point user attempting to login can being attempting again in the `lockedUntil` property. It is calculated by added `LOCK_DURATION_MINUTES`to the timestamp of when the user attempt to login too many times.

If the password is invalid the user is NOT explicitly told them used a wrong password. 

The logic for calculating failed attempts, locked out time, and error messages are found in login() function in `auth.service.js` and the updateUser() function in `auth.repository.js`.
