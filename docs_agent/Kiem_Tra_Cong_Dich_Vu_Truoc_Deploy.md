# Kiem Tra Cong/Dich Vu Tren VPS Truoc Khi Deploy

## 1) Chay script kiem tra tong hop

Tren VPS (PowerShell Run as Administrator):

```powershell
powershell -ExecutionPolicy Bypass -File C:\inetpub\wwwroot\stick\backend\scripts\check_vps_ports.ps1 -StartPort 3000 -EndPort 3100 -DesiredPort 3040
```

Script se in ra:

- Tat ca TCP ports dang LISTEN + process name
- Danh sach PM2 apps + port env (neu co)
- IIS site bindings hien tai
- Ket luan port mong muon (`DesiredPort`) dang free hay bi chiem
- Goi y 10 cong trong range

## 2) Neu cong 3040 bi trung

1. Chon cong trong tu danh sach goi y (vd `3041`).
2. Sua:
- `backend/ecosystem.config.cjs` (`PORT`)
- `backend/deploy/iis/web.config` (`localhost:<PORT>`)
3. Restart:

```powershell
pm2 restart stick-api-prod --update-env
iisreset
```

## 3) Kiem tra sau khi doi cong

```powershell
curl http://localhost:<PORT>/health
curl http://160.30.113.26/health
```

