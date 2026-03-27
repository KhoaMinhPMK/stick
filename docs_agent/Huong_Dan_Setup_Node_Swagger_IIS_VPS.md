# Huong Dan Setup Node.js Swagger Tren VPS Windows + IIS

Cap nhat: 2026-03-27

## 1) Ket qua da trien khai trong repo

Da tao xong backend Hello World + Swagger:

- `backend/src/server.js`
- `backend/docs/openapi.yaml`
- `backend/package.json` (scripts `start`, `dev`)
- `backend/ecosystem.config.cjs` (PM2 config)
- `backend/scripts/pull_and_reload.ps1` (pull code + reload)
- `backend/deploy/iis/web.config` (IIS reverse proxy rewrite rule)

Endpoint test:

- `GET /health`
- `GET /hello`
- `GET /docs` (Swagger UI)
- `GET /docs.json` (OpenAPI JSON)

Port backend mac dinh: `3040`.

## 2) Chay local de test truoc

Tu thu muc `backend`:

```powershell
yarn install
yarn start
```

Mo trinh duyet:

- `http://localhost:3040/health`
- `http://localhost:3040/hello`
- `http://localhost:3040/docs`

Neu 3 link nay OK thi backend mau da san sang deploy.

## 3) Setup VPS Windows (mot lan duy nhat)

## 3.1 Cai dat can thiet

1. Cai Node.js LTS.
2. Cai Git.
3. Cai IIS (Web Server role).
4. Cai `URL Rewrite` cho IIS.
5. Cai `Application Request Routing (ARR)` cho IIS.
6. Cai PM2 global:

```powershell
npm i -g pm2
```

## 3.2 Clone code len VPS

```powershell
mkdir C:\apps -ErrorAction SilentlyContinue
cd C:\apps
git clone <YOUR_REPO_URL> stick
cd C:\apps\stick\backend
yarn install
```

## 3.3 Chay backend bang PM2

```powershell
cd C:\apps\stick\backend
pm2 start ecosystem.config.cjs
pm2 save
```

Kiem tra:

```powershell
pm2 status
Invoke-WebRequest http://localhost:3040/health -UseBasicParsing
```

## 4) Cau hinh IIS reverse proxy den Node

## 4.1 Tao proxy site folder

```powershell
mkdir C:\inetpub\stick-proxy -ErrorAction SilentlyContinue
copy C:\apps\stick\backend\deploy\iis\web.config C:\inetpub\stick-proxy\web.config
```

## 4.2 Tao website trong IIS

1. Mo IIS Manager.
2. `Sites` -> `Add Website`.
3. Site name: `stick-backend`.
4. Physical path: `C:\inetpub\stick-proxy`.
5. Binding:
- Type: `http`
- Port: `80`
- Host name: de trong neu dung truy cap bang IP `160.30.113.26`, hoac nhap domain neu da co (`api.yourdomain.com`)

## 4.3 Bat proxy trong ARR

1. Chon node server (root may chu) trong IIS Manager.
2. Mo `Application Request Routing Cache`.
3. Ben phai chon `Server Proxy Settings...`.
4. Tick `Enable proxy`.
5. Apply.

Sau do test:

- `http://api.yourdomain.com/health`
- `http://api.yourdomain.com/docs`
- Neu ban chua gan domain, co the test thang theo IP: `http://160.30.113.26/health` va `http://160.30.113.26/docs`

Ghi chu:
- Neu di qua IIS reverse proxy: dung URL khong can port (`80/443`), vd `http://160.30.113.26/health`.
- Neu test truc tiep Node (bo qua IIS): dung `http://160.30.113.26:3040/health`.

## 5) Quy trinh van hanh ve sau (push/pull/reload)

Sau moi lan ban push code tu local:

Tren VPS chay:

```powershell
powershell -ExecutionPolicy Bypass -File C:\apps\stick\backend\scripts\pull_and_reload.ps1 -RepoPath C:\apps\stick -Branch main
```

Script se tu dong:

1. `git fetch + pull`
2. `yarn install --immutable`
3. `pm2 restart stick-backend`
4. `pm2 save`

## 6) Lenh kiem tra nhanh khi co su co

```powershell
pm2 status
pm2 logs stick-backend --lines 100
Invoke-WebRequest http://localhost:3040/health -UseBasicParsing
```

Neu local port 3040 OK nhung domain/IP loi:

1. Kiem tra IIS site co running khong.
2. Kiem tra ARR proxy da enable khong.
3. Kiem tra firewall (80/443).
4. Kiem tra SSL binding (neu dung https).

## 7) Buoc tiep theo khuyen nghi

1. Them `.env` + config loader cho production.
2. Them endpoint `/api/v1/...` va auth middleware.
3. Them CI/CD de VPS auto pull qua webhook.
