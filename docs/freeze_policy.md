#### Freeze Policy

The Freeze Policy is simple enough. If you attempt to login to an account with a valid username, but enter the wrong password too many times you are temporarily locked out of your account for a number of minutes.

##### Current Settings

The current policy allows for eight invalid password attempts and then it will freeze you out for two minutes.

The current policy is overly generous to allow for easy testing during development. This can be adjusted for production by simply changing a couple variables found in file `server/src/modules/auth/auth.service.js` in the `failedLoginCount` variables.
