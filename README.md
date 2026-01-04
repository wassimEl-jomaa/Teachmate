# EduMate

Detta projekt är en webbapplikation som är designad för att hantera och spåra läxor för studenter.
Den inkluderar både ett frontend byggt med React och ett backend byggt med FastAPI.

# How to login to server
1. Open Command Line (CMD)
```
cmd.exe
```
2. Enter following code to login:
```
ssh root@78.109.17.96
```


# How to build and run frontend in server
1. Push changes to GitHub from local PC
```
git add .
git commit -m ""
git push
```
2. Login to server
```
ssh root@78.109.17.96
```
3. Navigate to frontend repo:
```
cd /var/www/teachmate/Teachmate/frontend/teachmate
```
4. Git pull new changes
```
git pull
```
5. Build new frontend:
```
npm run build
```
6. Restart backend server
```
pm2 restart frontend
```

# How to build and run backend in server
1. Push changes to GitHub from local PC
```
git add .
git commit -m ""
git push
```
2. Login to server
```
ssh root@78.109.17.96
```
3. Navigate to frontend repo:
```
cd /var/www/teachmate/Teachmate
```
4. Git pull new changes
```
git pull
```
5. Restart backend server
```
pm2 restart fastapi
```

# How to control running servers (frontend/backend)
## List all servers
```
pm2 list
```
## Stop servers
```
pm2 stop <name>
```
## Restart servers
```
pm2 restart <name>
```

# Database managment
## pgAdmin 4
```
https://www.pgadmin.teachmate.se/
username: wassimeljomaa@gmail.com
```