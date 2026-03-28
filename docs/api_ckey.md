Lấy Danh Sách GPU
Sử dụng phương thức GET hoặc POST để lấy danh sách GPU:

https://ckey.vn/api/getgpu3?key=[key]&gpu=[gpuType]&continent=[continent]&sort=[sort]&count=[count]
Tham số:

key: Khóa API của bạn.
gpu: Loại GPU bạn muốn lấy thông tin.
continent: Quốc Gia muốn lấy thông tin.
sort: Lọc theo giá.
count: Số lượng GPU muốn lọc, ví dụ 1, 2.
GPU:
all

Continent:
All

Sort:
price_asc

Kết quả thành công:

[{"id":92329,"gpu_name":"1x GTX 1660 Ti - 6 GB","cpu":"AMD Ryzen 3 1200 Quad-Core Processor","cpu_cores":"4\/4","ram":"7.86 GB","disk_space":"KINGSTON SNVS250G 185.7241GB","inet_down":"92.78","inet_up":"21.43","disk_speed":"850.41 MB\/s","cuda_max":"12.4","location":"HU","reliability":"99.96","max_duration":"160","price":"351 VND\/Giờ","price_text":"giờ","raw_price":351.3267333333333},{"id":81101,"gpu_name":"1x GTX 1060 6GB - 6 GB","cpu":"Intel(R) Core(TM) i5-8400 CPU @ 2.80GHz","cpu_cores":"6\/6","ram":"3.86 GB","disk_space":"SPCCx20Solidx20Statex 63.4167GB","inet_down":"62.78","inet_up":"83.07","disk_speed":"357.47 MB\/s","cuda_max":"13.0","location":"RU","reliability":"99.89","max_duration":"700","price":"379 VND\/Giờ","price_text":"giờ","raw_price":379.1317348}]
API Link:

https://ckey.vn/api/getgpu3?key=gyDn3DjFf4xi5gGIny2ew&gpu=all&continent=all&sort=price_asc&count=[count]
Thuê GPU
Tùy chọn thuê gpu:

https://ckey.vn/api/thuegpu3?key=[key]&id=[id]&templates=[templates]&password=[password]&port=[port]&env=[KEY=VALUE]
Tham số:

key: Khóa API của bạn.
id: ID của node GPU.
templates: ID template preset hoặc custom image dạng namespace/image:tag.
password: Mật khẩu để kết nối sau khi tạo thành công.
port: VD 111,222.
env: ENV custom, hỗ trợ dạng KEY=VALUE hoặc JSON object.
Templates: 
nvidia/cuda:12.0.1-devel-ubuntu20.04
Kết quả thành công:

{
  "status": 200,
  "message": "Thuê GPU thành công!",
  "id": 1234
}
API Link:

https://ckey.vn/api/thuegpu3?key=gyDn3DjFf4xi5gGIny2ew&id=[id]&templates=1&password=[password]&port=[port]&env=[KEY=VALUE]
DELETE GPU
Tùy chọn DELETE GPU:

https://ckey.vn/api/option_gpu3?key=[key]&id=[id]&option=[option]
Tham số:

key: Khóa API của bạn.
id: ID GPU đã thuê.
option: 
Delete
Kết quả thành công:

{"message":"Delete successful","success":true}
API Link:

https://ckey.vn/api/option_gpu3?key=gyDn3DjFf4xi5gGIny2ew&id=[id]&option=delete
Lấy thông tin GPU
Tùy chọn Lấy thông tin GPU:

https://ckey.vn/api/infogpu3?key=[key]&id=[id]
Tham số:

key: Khóa API của bạn.
id: ID GPU đã thuê.
Kết quả thành công:

{"operating_system":"chieustudio/ubuntu-ssh-ttyd:jammy-20250530","public_ipaddr":"n1.ckey.vn","geolocation":"RU","gpu_name":" GTX 1060 6GB","cpu_name":"6/6","ram":3.8621,"storage":"63.4165","price":"379 VND","ssh_port":"N/A","kasm_port":"N/A","online_status":{"text":"Hoạt động","class":"badge-success"},"mon_container_status":{"text":"Khởi tạo xong","class":"badge-success"},"port_forwards":{"123":"3561","124":"3562"},"mrl":"27-12-2025 21:09:16"}
API Link:

https://ckey.vn/api/infogpu3?key=gyDn3DjFf4xi5gGIny2ew&id=[id]