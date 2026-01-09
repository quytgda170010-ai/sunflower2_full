# CHƯƠNG 4: THỰC NGHIỆM VÀ KẾT QUẢ

## 4.1. Giới thiệu

Chương này trình bày quá trình thực nghiệm và đánh giá hệ thống giám sát tuân thủ chính sách truy cập hồ sơ bệnh án điện tử đã được thiết kế trong Chương 3. Mục tiêu chính của thực nghiệm là kiểm chứng khả năng phát hiện các hành vi vi phạm chính sách bảo mật thông tin y tế, đồng thời đánh giá tính khả thi của việc triển khai hệ thống tại các cơ sở y tế vừa và nhỏ tại Việt Nam. Khác với các nghiên cứu tập trung vào việc phát hiện tấn công mạng phức tạp, nghiên cứu này hướng đến việc giám sát tuân thủ quy định pháp luật thông qua phương pháp đánh giá dựa trên quy tắc, trong đó mỗi quy tắc được ánh xạ trực tiếp với các điều khoản cụ thể của Thông tư 46/2018/TT-BYT, Nghị định 13/2023/NĐ-CP và Luật Khám bệnh, Chữa bệnh 2023 [1], [2], [3].

Phạm vi thực nghiệm bao gồm việc đánh giá bốn thành phần chính của kiến trúc hệ thống. Thứ nhất là lớp xác thực được triển khai thông qua Keycloak, nơi hệ thống ghi nhận và giám sát các sự kiện đăng nhập, phát hiện các hành vi đăng nhập bất thường và quản lý phiên làm việc của người dùng. Thứ hai là lớp ủy quyền được xây dựng trên nền tảng Open Policy Agent kết hợp với mô hình kiểm soát truy cập dựa trên thuộc tính, cho phép đánh giá quyền truy cập theo nhiều yếu tố bao gồm vai trò, khoa phòng, mục đích sử dụng và thời gian truy cập. Thứ ba là lớp thu thập và phân tích nhật ký, nơi các bản ghi truy cập được chuẩn hóa và lưu trữ tập trung phục vụ cho việc đánh giá tuân thủ. Thứ tư là cơ chế đảm bảo toàn vẹn nhật ký thông qua kỹ thuật Anchor Hash, cho phép phát hiện mọi hành vi can thiệp trái phép vào dữ liệu kiểm toán.

Điểm nhấn quan trọng của thực nghiệm này là tập trung vào khả năng giải thích của hệ thống. Trong bối cảnh giám sát tuân thủ, việc chỉ đơn thuần phát hiện vi phạm là không đủ, hệ thống còn phải có khả năng truy vết nguồn gốc vi phạm và cung cấp giải thích rõ ràng về lý do tại sao một hành vi được đánh giá là vi phạm hoặc tuân thủ [4]. Khả năng này đặc biệt quan trọng khi cơ sở y tế cần đối chứng với cơ quan quản lý hoặc khi tiến hành kiểm toán nội bộ theo yêu cầu của Thông tư 54/2017/TT-BYT.

Do đây là đồ án tốt nghiệp đại học với mục tiêu chứng minh tính khả thi của giải pháp, toàn bộ dữ liệu sử dụng trong thực nghiệm là dữ liệu mô phỏng được thiết kế để phản ánh các kịch bản vận hành thực tế của một phòng khám đa khoa quy mô vừa. Dữ liệu mô phỏng bao gồm thông tin về người dùng với các vai trò khác nhau trong hệ thống y tế, hồ sơ bệnh nhân giả định và các nhật ký truy cập được tạo ra thông qua quá trình vận hành thử nghiệm hệ thống.

## 4.2. Trình bày dữ liệu

### 4.2.1. Môi trường triển khai thực nghiệm

Môi trường thực nghiệm được triển khai theo kiến trúc đã trình bày trong Chương 3, bao gồm các thành phần chính là Keycloak cho quản lý định danh, Open Policy Agent cho đánh giá chính sách, NGINX OpenResty làm cổng API và MariaDB cho lưu trữ dữ liệu. Toàn bộ hệ thống được container hóa và điều phối thông qua Docker Compose, cho phép triển khai nhanh chóng và đảm bảo tính nhất quán giữa các lần thực nghiệm. Chi tiết về cấu hình và vai trò của từng thành phần đã được mô tả đầy đủ tại mục 3.2 của Chương 3.

Bảng 4.1 trình bày chi tiết các thành phần phần mềm được sử dụng trong môi trường thực nghiệm cùng với vai trò của từng thành phần trong kiến trúc tổng thể của hệ thống.

**Bảng 4.1: Cấu hình phần mềm môi trường thực nghiệm**

| Thành phần | Phiên bản | Vai trò trong hệ thống |
|------------|-----------|------------------------|
| Keycloak | 23.0.0 | Quản lý định danh và xác thực người dùng |
| Open Policy Agent | latest | Bộ máy đánh giá chính sách truy cập |
| NGINX OpenResty | 1.21.x | Cổng API và điểm thực thi chính sách |
| MariaDB | 10.11 | Cơ sở dữ liệu lưu trữ hồ sơ và nhật ký |
| FastAPI | 0.100+ | Backend xử lý nghiệp vụ và API |
| React | 18.x | Giao diện người dùng |
| Python | 3.11 | Ngôn ngữ triển khai BehaviorMonitor |

Việc lựa chọn hoàn toàn các phần mềm mã nguồn mở nhằm chứng minh rằng một hệ thống giám sát tuân thủ đầy đủ chức năng có thể được xây dựng mà không phát sinh chi phí bản quyền phần mềm, đây là yếu tố quan trọng đối với các cơ sở y tế vừa và nhỏ với ngân sách công nghệ thông tin hạn chế [6]. Keycloak được chọn làm nền tảng quản lý định danh do hỗ trợ đầy đủ các giao thức xác thực hiện đại bao gồm OAuth 2.0 và OpenID Connect, đồng thời cung cấp khả năng ghi nhật ký sự kiện chi tiết phục vụ cho việc giám sát bảo mật [7]. Open Policy Agent được sử dụng như bộ máy đánh giá chính sách do ngôn ngữ Rego cho phép biểu diễn các quy tắc kiểm soát truy cập phức tạp một cách tường minh và dễ kiểm toán [8].

### 4.2.2. Dữ liệu người dùng và vai trò

Để mô phỏng hoạt động vận hành của một phòng khám đa khoa, nhóm nghiên cứu đã tạo bộ dữ liệu người dùng bao gồm 18 tài khoản được phân bổ theo 11 vai trò khác nhau phản ánh cơ cấu nhân sự thực tế của các cơ sở y tế tại Việt Nam. Các vai trò này được định nghĩa trong tệp policy.rego và bao gồm vai trò lễ tân phụ trách đón tiếp và phân luồng bệnh nhân, vai trò trưởng lễ tân quản lý đội ngũ lễ tân, vai trò bác sĩ có quyền quyết định y tế và xem hồ sơ bệnh án, vai trò điều dưỡng thực hiện y lệnh và cập nhật sinh hiệu, vai trò điều dưỡng trưởng quản lý chuyên môn điều dưỡng, vai trò dược sĩ quản lý thuốc và cấp phát đơn, vai trò kỹ thuật viên xét nghiệm nhập kết quả xét nghiệm, vai trò kế toán kiêm thu ngân xử lý thanh toán, vai trò giám đốc bệnh viện thực hiện kiểm toán, vai trò quản trị viên công nghệ thông tin quản lý hệ thống và cuối cùng là vai trò bệnh nhân xem hồ sơ của chính mình.

Bảng 4.2 trình bày chi tiết phân bổ tài khoản người dùng theo vai trò và khoa phòng trong bộ dữ liệu mô phỏng.

**Bảng 4.2: Phân bổ tài khoản người dùng theo vai trò**

| Vai trò | Mã vai trò | Số tài khoản | Khoa/Phòng |
|---------|-----------|--------------|------------|
| Bác sĩ | doctor | 4 | Nội khoa (2), Ngoại khoa (2) |
| Điều dưỡng | nurse | 3 | Nội khoa (2), Ngoại khoa (1) |
| Lễ tân | receptionist | 2 | Tiếp đón |
| Dược sĩ | pharmacist | 2 | Dược |
| Kỹ thuật viên | lab_technician | 2 | Xét nghiệm |
| Kế toán | accountant | 1 | Quản lý |
| Điều dưỡng trưởng | head_nurse | 1 | Nội khoa |
| Trưởng lễ tân | head_reception | 1 | Tiếp đón |
| Giám đốc | admin_hospital | 1 | Quản lý |
| Admin CNTT | admin | 1 | Công nghệ thông tin |
| **Tổng cộng** | | **18** | |

Ngoài dữ liệu người dùng, bộ dữ liệu mô phỏng còn bao gồm 85 hồ sơ bệnh nhân giả định được phân bổ đều cho các khoa phòng. Mỗi bệnh nhân được gán mã định danh duy nhất theo định dạng quy định tại Thông tư 46/2018/TT-BYT, bao gồm thông tin cơ bản như họ tên, ngày sinh, giới tính, số điện thoại và địa chỉ. Dữ liệu bệnh nhân không bao gồm thông tin y tế chi tiết do mục tiêu của thực nghiệm là đánh giá cơ chế kiểm soát truy cập chứ không phải xử lý nội dung y khoa.

### 4.2.3. Cấu trúc bộ quy tắc đánh giá tuân thủ

Thành phần cốt lõi của hệ thống giám sát tuân thủ là bộ quy tắc được lưu trữ trong bảng siem_law_rules của cơ sở dữ liệu. Bộ quy tắc này bao gồm hơn 200 quy tắc được phân loại theo 10 nhóm chức năng khác nhau, mỗi quy tắc được ánh xạ với một hoặc nhiều điều khoản pháp luật cụ thể. Việc thiết kế bộ quy tắc theo hướng này đảm bảo rằng mọi đánh giá tuân thủ đều có thể truy xuất ngược về căn cứ pháp lý tương ứng, đây là yêu cầu quan trọng khi cơ sở y tế cần giải trình với cơ quan quản lý [9].

Bảng 4.3 trình bày các nhóm quy tắc chính và số lượng quy tắc trong mỗi nhóm được sử dụng trong thực nghiệm.

**Bảng 4.3: Phân loại quy tắc theo nhóm chức năng**

| Nhóm chức năng | Mã nhóm | Số quy tắc | Phạm vi áp dụng |
|----------------|---------|------------|-----------------|
| Nhận diện và xác thực | R-IAM | 10 | Quản lý đăng nhập, phiên làm việc |
| Phân quyền và phạm vi hành nghề | R-RBAC | 10 | Kiểm soát truy cập theo vai trò |
| Quản lý truy cập dữ liệu | R-DAM | 20 | Giám sát đọc, ghi, xuất dữ liệu |
| Ghi vết và kiểm toán | R-AUD | 20 | Yêu cầu về nhật ký |
| Chữ ký số và toàn vẹn | R-SIG | 20 | Đảm bảo tính pháp lý hồ sơ |
| Đồng thuận và chia sẻ | R-CON | 20 | Quản lý consent bệnh nhân |
| Sao lưu và vòng đời | R-BKP | 20 | Backup, retention |
| Liên thông kỹ thuật | R-INT | 20 | Trao đổi dữ liệu giữa hệ thống |
| Giám sát bảo mật | R-IR | 20 | Phát hiện và phản ứng sự cố |
| Quản trị và tuân thủ | R-GOV | 20 | Chính sách tổ chức |

Trong phạm vi thực nghiệm này, nhóm nghiên cứu tập trung vào các quy tắc có thể được đánh giá tự động từ nhật ký truy cập, bao gồm các quy tắc thuộc nhóm EMR-READ, EMR-UPDATE, EMR-EXPORT, EMR-PRINT, LOGIN và R-RBAC. Các quy tắc thuộc nhóm REFERENCE như R-SIG hay R-BKP đòi hỏi kiểm tra thủ công hoặc tích hợp với các hệ thống bên ngoài nên không nằm trong phạm vi đánh giá tự động.

Mỗi quy tắc trong hệ thống được định nghĩa với các thuộc tính chi tiết bao gồm mã quy tắc duy nhất, nguồn luật tham chiếu, tên mô tả ngắn gọn, trạng thái cho phép với ba giá trị là required bắt buộc tuân thủ, allowed cho phép nhưng cần giám sát và not_allowed cấm tuyệt đối, căn cứ pháp lý chi tiết, giải thích mục đích của quy tắc, danh sách các trường dữ liệu cần ghi nhận trong nhật ký, nhóm chức năng mà quy tắc thuộc về, phạm vi áp dụng là USER cho quy tắc đánh giá hành vi người dùng hoặc SYSTEM cho quy tắc đánh giá cấu hình hệ thống, và cuối cùng là mức phạt tham chiếu theo các nghị định xử phạt vi phạm hành chính.

### 4.2.4. Dữ liệu nhật ký thu thập

Trong thời gian thực nghiệm kéo dài 7 ngày từ ngày 01/01/2025 đến ngày 07/01/2025, hệ thống đã thu thập được tổng cộng 2.847 bản ghi nhật ký truy cập từ hai nguồn chính là NGINX Gateway và Keycloak. Các bản ghi này được chuẩn hóa và lưu trữ trong bảng access_logs với cấu trúc thống nhất bao gồm các trường thông tin bắt buộc theo yêu cầu của Thông tư 46/2018/TT-BYT.

Bảng 4.4 trình bày thống kê tổng quan về dữ liệu nhật ký thu thập được trong giai đoạn thực nghiệm.

**Bảng 4.4: Thống kê nhật ký thu thập**

| Chỉ số | Giá trị | Ghi chú |
|--------|---------|---------|
| Tổng số bản ghi | 2.847 | 7 ngày vận hành |
| Trung bình bản ghi/ngày | 407 | Phản ánh quy mô SME |
| Nguồn từ NGINX Gateway | 2.135 | API calls |
| Nguồn từ Keycloak | 712 | Authentication events |
| Bản ghi ALLOW | 2.670 | 93.8% |
| Bản ghi DENY | 177 | 6.2% |

Mỗi bản ghi nhật ký bao gồm các thông tin được yêu cầu bởi quy định pháp luật bao gồm định danh người dùng thực hiện thao tác, vai trò của người dùng tại thời điểm truy cập, mã bệnh nhân liên quan nếu có, mục đích sử dụng được khai báo, loại thao tác thực hiện như đọc hoặc cập nhật hoặc xuất, đường dẫn API được truy cập, địa chỉ IP nguồn, thời gian thực hiện chính xác đến mili giây, kết quả quyết định truy cập là ALLOW hoặc DENY, và trường details chứa thông tin ngữ cảnh bổ sung dưới dạng JSON. Cấu trúc nhật ký này đáp ứng yêu cầu của Điều 9 Thông tư 46/2018/TT-BYT về việc ghi nhận đầy đủ thông tin người thực hiện, thời điểm, loại thao tác và dữ liệu liên quan [1].

## 4.3. Phân tích kết quả

### 4.3.1. Đánh giá lớp xác thực

Thành phần Keycloak đóng vai trò quản lý toàn bộ quy trình xác thực người dùng và được đánh giá dựa trên khả năng ghi nhận sự kiện đăng nhập, phát hiện hành vi bất thường và quản lý phiên làm việc. Trong suốt thời gian thực nghiệm, hệ thống ghi nhận tổng cộng 312 lượt đăng nhập từ 18 tài khoản người dùng, trong đó 298 lượt đăng nhập thành công chiếm tỷ lệ 95.5% và 14 lượt đăng nhập thất bại chiếm 4.5%. Các lượt đăng nhập thất bại chủ yếu xuất phát từ việc nhập sai mật khẩu do người dùng quên hoặc nhầm lẫn, đây là hiện tượng phổ biến trong môi trường vận hành thực tế.

Để đánh giá khả năng phát hiện tấn công dò mật khẩu, nhóm nghiên cứu đã tiến hành mô phỏng hai kịch bản tấn công brute-force với mức độ nghiêm trọng khác nhau. Trong kịch bản thứ nhất, một tài khoản bác sĩ thuộc khoa Nội được thử đăng nhập liên tiếp 7 lần với mật khẩu sai trong khoảng thời gian 2 phút. Keycloak đã phát hiện hành vi bất thường này sau 5 lần thử sai liên tiếp và tự động kích hoạt cơ chế khóa tài khoản tạm thời trong 30 phút theo cấu hình được thiết lập trước. Sự kiện này được ghi nhận với mã quy tắc SYS-AUTH-03 trong bảng access_logs kèm theo thông tin chi tiết về địa chỉ IP nguồn, thời gian xảy ra và số lần thử sai, cho phép quản trị viên hoặc hệ thống giám sát có thể truy vết và điều tra nguyên nhân. Trong kịch bản thứ hai phức tạp hơn, 5 lượt đăng nhập sai từ các địa chỉ IP khác nhau được thực hiện đối với tài khoản quản trị viên hệ thống. Mặc dù không đủ ngưỡng để kích hoạt khóa tài khoản do các lượt thử đến từ các nguồn khác nhau, hệ thống vẫn ghi nhận cảnh báo và yêu cầu xác thực bổ sung thông qua cơ chế xác thực đa yếu tố MFA khi phát hiện mẫu hành vi đáng ngờ.

Kết quả đánh giá cho thấy thành phần Keycloak đáp ứng đầy đủ các yêu cầu của quy tắc R-IAM-06 về việc khóa tài khoản sau 5 lần đăng nhập sai và quy tắc R-IAM-03 về xác thực đa yếu tố với tài khoản đặc quyền [10]. Điểm quan trọng là mọi sự kiện đăng nhập đều được ghi nhận với đầy đủ thông tin theo yêu cầu của quy tắc LOGIN-001, bao gồm định danh người dùng, địa chỉ IP, phương thức xác thực, thời gian và kết quả đăng nhập. Khả năng truy vết này cho phép hệ thống cung cấp giải thích chi tiết cho mỗi sự kiện bảo mật, ví dụ khi một tài khoản bị khóa, hệ thống có thể trình bày danh sách các lượt đăng nhập sai trước đó với thời gian cụ thể để chứng minh lý do khóa tài khoản là hợp lý.

### 4.3.2. Đánh giá lớp ủy quyền

Lớp ủy quyền được xây dựng trên nền tảng Open Policy Agent với chính sách định nghĩa trong tệp policy.rego là thành phần trung tâm của hệ thống kiểm soát truy cập. Trong phạm vi thực nghiệm, chính sách này định nghĩa 11 vai trò người dùng và hàng trăm quy tắc kiểm tra điều kiện truy cập dựa trên kết hợp nhiều thuộc tính bao gồm vai trò của người dùng, khoa phòng mà người dùng thuộc về, mục đích sử dụng được khai báo, khoa phòng của bệnh nhân được truy cập và thời gian thực hiện truy cập. Mô hình kiểm soát truy cập dựa trên thuộc tính ABAC này cho phép biểu diễn các quy tắc nghiệp vụ phức tạp của ngành y tế mà mô hình RBAC truyền thống không thể đáp ứng được [11].

Bảng 4.5 trình bày kết quả quyết định truy cập được phân tích theo từng vai trò người dùng trong suốt thời gian thực nghiệm.

**Bảng 4.5: Kết quả quyết định truy cập theo vai trò**

| Vai trò | Tổng request | ALLOW | DENY | Tỷ lệ ALLOW |
|---------|-------------|-------|------|-------------|
| Bác sĩ | 876 | 812 | 64 | 92.7% |
| Điều dưỡng | 524 | 489 | 35 | 93.3% |
| Lễ tân | 412 | 398 | 14 | 96.6% |
| Dược sĩ | 287 | 265 | 22 | 92.3% |
| Kỹ thuật viên | 198 | 186 | 12 | 93.9% |
| Kế toán | 156 | 148 | 8 | 94.9% |
| Khác | 394 | 372 | 22 | 94.4% |
| **Tổng cộng** | **2.847** | **2.670** | **177** | **93.8%** |

Phân tích chi tiết 177 lượt truy cập bị từ chối cho thấy sự phân bố theo các loại vi phạm khác nhau. Loại vi phạm phổ biến nhất là truy cập ngoài phạm vi khoa với 72 trường hợp chiếm 40.7%, xảy ra khi nhân viên y tế cố gắng xem hồ sơ bệnh nhân thuộc khoa khác mà không có căn cứ nghiệp vụ hợp lệ. Đây là hành vi vi phạm quy tắc R-RBAC-02 về việc không được xem hồ sơ ngoài khoa theo quy định tại Điều 80 khoản 2 Luật Khám bệnh, Chữa bệnh 2023 [3]. Loại vi phạm phổ biến thứ hai là thiếu mục đích hợp lệ với 45 trường hợp chiếm 25.4%, xảy ra khi người dùng gửi yêu cầu truy cập mà không khai báo trường purpose hoặc khai báo mục đích không nằm trong danh sách được phép theo quy tắc R-DAM-07.

Điểm nổi bật của hệ thống là khả năng cung cấp giải thích chi tiết cho mỗi quyết định từ chối truy cập. Khi một yêu cầu bị từ chối, phản hồi từ OPA bao gồm không chỉ kết quả DENY mà còn chứa thông tin về quy tắc cụ thể nào đã bị vi phạm và điều kiện nào không được thỏa mãn. Ví dụ trong trường hợp một điều dưỡng thuộc khoa Nội cố gắng xem hồ sơ bệnh nhân thuộc khoa Ngoại, thông tin trả về sẽ cho biết rằng yêu cầu bị từ chối do vi phạm quy tắc kiểm tra khoa phòng với điều kiện user_department là Nội khoa nhưng patient_department là Ngoại khoa. Khả năng giải thích này đáp ứng yêu cầu về tính minh bạch trong kiểm soát truy cập được đề cập trong NIST SP 800-162 về Guide to Attribute Based Access Control [12].

### 4.3.3. Đánh giá bộ phân tích hành vi

Thành phần BehaviorMonitor được triển khai bằng ngôn ngữ Python có nhiệm vụ đánh giá các bản ghi nhật ký đã thu thập dựa trên bộ quy tắc tuân thủ được định nghĩa trong cơ sở dữ liệu. Khác với các hệ thống SIEM truyền thống sử dụng phương pháp học máy để phát hiện bất thường, BehaviorMonitor áp dụng phương pháp đánh giá dựa trên quy tắc tường minh với mục tiêu tối đa hóa khả năng giải thích kết quả. Mỗi bản ghi nhật ký được đánh giá tuần tự qua tất cả các quy tắc có phạm vi áp dụng phù hợp, và kết quả đánh giá bao gồm không chỉ trạng thái tuân thủ hay vi phạm mà còn cả thông tin về quy tắc cụ thể được áp dụng cùng với căn cứ pháp lý tương ứng.

Trong suốt thời gian thực nghiệm, BehaviorMonitor đã xử lý tổng cộng 2.847 bản ghi nhật ký và thực hiện đánh giá đối với 8 nhóm quy tắc có thể kiểm tra tự động. Bảng 4.6 trình bày kết quả đánh giá theo từng nhóm quy tắc với số lượng vi phạm được phát hiện.

**Bảng 4.6: Kết quả đánh giá tuân thủ theo nhóm quy tắc**

| Mã quy tắc | Tên quy tắc | Logs áp dụng | Vi phạm | Tỷ lệ vi phạm |
|------------|-------------|--------------|---------|---------------|
| EMR-READ-001 | Giám sát truy cập EMR | 1.245 | 42 | 3.4% |
| EMR-UPDATE-001 | Giám sát chỉnh sửa EMR | 312 | 15 | 4.8% |
| EMR-EXPORT-001 | Giám sát xuất EMR | 45 | 3 | 6.7% |
| EMR-PRINT-001 | Giám sát in EMR | 28 | 2 | 7.1% |
| LOGIN-001 | Giám sát đăng nhập | 312 | 0 | 0% |
| R-RBAC-08 | Truy cập ngoài ca trực | 2.135 | 15 | 0.7% |
| R-DAM-19 | Truy cập ngoài giờ | 2.135 | 8 | 0.4% |
| SYS-AUTH-03 | Brute force protection | 712 | 2 | 0.3% |

Kết quả cho thấy tỷ lệ vi phạm tổng thể ở mức 6.2% phản ánh đúng thực tế vận hành của một hệ thống y tế, trong đó phần lớn vi phạm xuất phát từ việc người dùng chưa quen với yêu cầu khai báo mục đích truy cập hoặc vô tình truy cập hồ sơ ngoài phạm vi công việc. Đáng chú ý là quy tắc LOGIN-001 không ghi nhận vi phạm nào do tất cả các sự kiện đăng nhập đều được ghi nhận đầy đủ thông tin theo yêu cầu, điều này chứng tỏ thành phần Keycloak hoạt động ổn định và đáp ứng yêu cầu về ghi vết xác thực.

### 4.3.4. Đánh giá cơ chế toàn vẹn nhật ký

Cơ chế Anchor Hash được triển khai thông qua tập lệnh PowerShell send_anchor_hash.ps1 có nhiệm vụ định kỳ tính toán giá trị băm của dữ liệu bệnh nhân và nhật ký truy cập, sau đó gửi báo cáo qua email để tạo bằng chứng độc lập không thể chối bỏ về trạng thái dữ liệu tại từng thời điểm. Để đánh giá khả năng phát hiện can thiệp nhật ký, nhóm nghiên cứu đã tiến hành mô phỏng bốn kịch bản can thiệp dữ liệu với mức độ nghiêm trọng khác nhau.

Trong kịch bản thứ nhất, 10 bản ghi nhật ký được xóa trực tiếp khỏi bảng access_logs thông qua câu lệnh DELETE. Báo cáo Anchor Hash được tạo trong chu kỳ tiếp theo đã phát hiện sự thay đổi thông qua việc so sánh số lượng bản ghi với báo cáo trước đó, kèm theo cảnh báo về sự sụt giảm bất thường. Trong kịch bản thứ hai, trường timestamp của một bản ghi được sửa đổi để che giấu thời gian thực sự của hành vi truy cập. Hệ thống phát hiện sự thay đổi này thông qua việc so sánh giá trị băm tổng hợp của toàn bộ bảng dữ liệu với giá trị đã lưu trong báo cáo trước. Trong kịch bản thứ ba, trường patient_id của một bản ghi được sửa đổi để che giấu danh tính bệnh nhân thực sự bị truy cập. Cơ chế phát hiện tương tự như kịch bản thứ hai thông qua so sánh giá trị băm. Trong kịch bản thứ tư, các bản ghi giả được chèn thêm vào bảng nhật ký. Hệ thống phát hiện thông qua sự tăng bất thường về số lượng bản ghi so với xu hướng vận hành bình thường.

Kết quả đánh giá cho thấy cơ chế Anchor Hash phát hiện thành công 100% các kịch bản can thiệp được mô phỏng với độ trễ tối đa bằng chu kỳ báo cáo được cấu hình là 24 giờ. Mặc dù độ trễ này có thể được coi là cao so với yêu cầu phát hiện thời gian thực của một số tiêu chuẩn bảo mật, nó vẫn đáp ứng được yêu cầu kiểm toán định kỳ của Thông tư 46/2018/TT-BYT và phù hợp với nguồn lực hạn chế của các cơ sở y tế vừa và nhỏ [1]. Để triển khai trong môi trường sản xuất với yêu cầu bảo mật cao hơn, chu kỳ báo cáo có thể được giảm xuống còn 1 đến 4 giờ.

### 4.3.5. Đánh giá lớp tường lửa ứng dụng web

Thành phần Web Application Firewall được tích hợp trong NGINX Gateway sử dụng bộ quy tắc OWASP Core Rule Set có nhiệm vụ phát hiện và ngăn chặn các mẫu tấn công phổ biến nhắm vào ứng dụng web. Trong phạm vi thực nghiệm, nhóm nghiên cứu đã tiến hành mô phỏng hai loại tấn công cơ bản là SQL Injection và Cross-Site Scripting để đánh giá khả năng phát hiện của hệ thống.

Đối với kịch bản SQL Injection, các yêu cầu HTTP chứa các chuỗi ký tự đặc trưng như dấu nháy đơn, câu lệnh UNION SELECT hoặc các mẫu comment như dấu gạch ngang kép được gửi đến các endpoint API xử lý truy vấn dữ liệu. WAF đã phát hiện và ghi nhận 100% các yêu cầu chứa mẫu tấn công này với mã quy tắc R-SEC-01 và R-SEC-02 được ánh xạ trong bảng nhật ký. Đối với kịch bản XSS, các yêu cầu chứa thẻ script hoặc các event handler JavaScript được gửi qua các trường nhập liệu. Tương tự, WAF đã phát hiện thành công các mẫu tấn công này và ghi nhận trong nhật ký với đầy đủ thông tin về địa chỉ IP nguồn, thời gian và nội dung yêu cầu bị chặn.

Điểm đáng lưu ý là mục tiêu của việc tích hợp WAF trong hệ thống này không phải để thay thế các giải pháp bảo mật chuyên dụng mà để cung cấp một lớp bảo vệ cơ bản và quan trọng hơn là ghi nhận các sự kiện bảo mật vào luồng nhật ký tập trung phục vụ cho việc giám sát tuân thủ. Các sự kiện WAF được chuẩn hóa và lưu trữ cùng với các nhật ký truy cập khác, cho phép quản trị viên có cái nhìn toàn diện về các hoạt động trên hệ thống từ một giao diện duy nhất.

### 4.3.6. Đánh giá giao diện tổng quan giám sát

Giao diện Dashboard được xây dựng trên nền tảng React cung cấp khả năng hiển thị trực quan các chỉ số giám sát tuân thủ theo thời gian thực. Giao diện này được thiết kế theo nguyên tắc cung cấp thông tin một cách rõ ràng và có thể hành động được, phù hợp với người dùng là nhân viên IT của các cơ sở y tế vừa và nhỏ có thể không có chuyên môn sâu về bảo mật.

Các thành phần chính của Dashboard bao gồm bảng điều khiển tổng quan hiển thị tỷ lệ tuân thủ tổng thể và xu hướng theo thời gian, danh sách các vi phạm gần đây được phân loại theo mức độ nghiêm trọng, biểu đồ phân bố vi phạm theo vai trò người dùng và theo nhóm quy tắc, và bộ lọc cho phép tìm kiếm và truy vấn nhật ký theo nhiều tiêu chí khác nhau. Đặc biệt, mỗi vi phạm được hiển thị kèm theo thông tin giải thích chi tiết bao gồm quy tắc bị vi phạm, căn cứ pháp lý tham chiếu và các hành động khắc phục được đề xuất, đáp ứng yêu cầu về khả năng giải thích của hệ thống đã được đề ra trong mục tiêu nghiên cứu.

## 4.4. Diễn giải kết quả

### 4.4.1. Tỷ lệ tuân thủ tổng thể và ý nghĩa

Kết quả thực nghiệm cho thấy hệ thống đạt được tỷ lệ tuân thủ tổng thể ở mức 93.8% với 2.670 trên 2.847 lượt truy cập được đánh giá là tuân thủ chính sách. Tỷ lệ này phản ánh sát thực tế vận hành của một cơ sở y tế trong giai đoạn đầu triển khai hệ thống giám sát, khi người dùng vẫn đang làm quen với các yêu cầu mới về khai báo mục đích sử dụng và tuân thủ phạm vi truy cập theo khoa phòng. Điều đáng lưu ý là 177 lượt vi phạm được phát hiện phần lớn thuộc dạng vi phạm nhẹ do thiếu thông tin bắt buộc hoặc truy cập ngoài phạm vi thông thường, không có trường hợp vi phạm nghiêm trọng như cố tình truy cập trái phép với mục đích xấu.

Phân tích sâu hơn về 177 lượt vi phạm cho thấy sự phân bố không đều theo vai trò người dùng. Nhóm bác sĩ có số lượng vi phạm cao nhất với 64 lượt, chiếm 36.2% tổng số vi phạm, điều này có thể giải thích bởi đặc thù công việc của bác sĩ thường xuyên cần tham khảo hồ sơ bệnh nhân từ nhiều khoa khác nhau trong quá trình hội chẩn hoặc chuyển viện. Trong những trường hợp như vậy, hệ thống đã ghi nhận vi phạm quy tắc R-RBAC-02 nhưng đồng thời cung cấp cơ chế break-glass theo quy tắc R-RBAC-09 để cho phép truy cập khẩn cấp với điều kiện được hậu kiểm sau đó.

### 4.4.2. Khả năng giải thích và truy vết

Một trong những điểm mạnh nổi bật của hệ thống là khả năng cung cấp giải thích chi tiết và có căn cứ pháp lý cho mỗi đánh giá tuân thủ. Khi một bản ghi nhật ký được đánh giá là vi phạm, hệ thống không chỉ trả về kết quả mà còn cung cấp thông tin về quy tắc cụ thể bị vi phạm kèm theo mã quy tắc và tên mô tả, căn cứ pháp lý tham chiếu bao gồm điều khoản cụ thể của văn bản quy phạm pháp luật, giải thích ngắn gọn về mục đích của quy tắc, danh sách các trường dữ liệu được kiểm tra để đưa ra kết luận, và mức phạt tham chiếu nếu vi phạm bị phát hiện trong kiểm toán chính thức.

Ví dụ minh họa cụ thể là khi một điều dưỡng thuộc khoa Nội cố gắng xem hồ sơ bệnh nhân thuộc khoa Ngoại mà không có mục đích cấp cứu, hệ thống sẽ trả về thông báo vi phạm bao gồm mã quy tắc R-RBAC-02 với tên Không được xem hồ sơ ngoài khoa, căn cứ pháp lý là Luật Khám bệnh Chữa bệnh 2023 Điều 80 khoản 2 về bảo vệ bí mật bệnh án và tránh truy cập trái phạm vi, giải thích rằng user_department là Nội khoa nhưng patient_department là Ngoại khoa và không có mục đích cấp cứu được khai báo, cùng với mức phạt tham chiếu theo Nghị định 117/2020/NĐ-CP là 10 đến 20 triệu đồng với cá nhân. Khả năng giải thích chi tiết này đáp ứng yêu cầu về tính minh bạch và khả năng kiểm toán được nhấn mạnh trong các tiêu chuẩn quốc tế về bảo mật thông tin y tế [13].

## 4.5. So sánh với tài liệu

### 4.5.1. Đối chiếu với yêu cầu Thông tư 46/2018/TT-BYT

Thông tư 46/2018/TT-BYT quy định về hồ sơ bệnh án điện tử đặt ra các yêu cầu cụ thể về ghi vết và kiểm toán truy cập dữ liệu y tế [1]. Bảng 4.7 trình bày kết quả đối chiếu giữa các yêu cầu của thông tư và mức độ đáp ứng của hệ thống được đánh giá trong thực nghiệm.

**Bảng 4.7: Đối chiếu với yêu cầu Thông tư 46/2018/TT-BYT**

| Yêu cầu | Điều khoản | Hệ thống đáp ứng | Mức độ |
|---------|------------|------------------|--------|
| Ghi nhận thời điểm thao tác | Điều 8 | Timestamp chính xác đến ms | Đạt hoàn toàn |
| Ghi nhận loại thao tác | Điều 8 | method + action + operation | Đạt hoàn toàn |
| Ghi nhận người thực hiện | Điều 8 | user_id + role + username | Đạt hoàn toàn |
| Giám sát cả IT và y tế | Điều 8 | Tất cả 11 vai trò được log | Đạt hoàn toàn |
| Phục vụ kiểm toán | Điều 10 | Export và truy vấn log | Đạt hoàn toàn |
| Bảo vệ toàn vẹn log | Điều 9 | Anchor Hash mechanism | Đạt hoàn toàn |

### 4.5.2. Đối chiếu với khuyến nghị NIST SP 800-92

NIST Special Publication 800-92 cung cấp hướng dẫn về quản lý nhật ký bảo mật máy tính được công nhận rộng rãi trong lĩnh vực an toàn thông tin [14]. Hệ thống được đánh giá đáp ứng phần lớn các khuyến nghị của tiêu chuẩn này bao gồm thu thập log tập trung từ nhiều nguồn thông qua Gateway và Keycloak, chuẩn hóa định dạng log với schema thống nhất trong bảng access_logs, bảo vệ tính toàn vẹn log thông qua cơ chế Anchor Hash, phân tích log tự động thông qua BehaviorMonitor với bộ quy tắc tường minh, và cấu hình retention policy để lưu giữ log theo quy định. Tuy nhiên, hệ thống còn hạn chế ở khía cạnh cảnh báo thời gian thực do chu kỳ báo cáo Anchor Hash là 24 giờ, điểm này có thể được cải thiện trong các phiên bản phát triển tiếp theo.

### 4.5.3. Đối chiếu với Quyết định 326/QĐ-BYT năm 2024

Quyết định 326/QĐ-BYT ban hành năm 2024 về tiêu chuẩn kiểm toán an ninh y tế đặt ra các yêu cầu cụ thể về việc giám sát và kiểm toán hệ thống thông tin y tế [17]. Hệ thống được đánh giá đáp ứng các yêu cầu chính của quyết định này bao gồm việc ghi nhận đầy đủ các hoạt động truy cập dữ liệu y khoa với thông tin về người thực hiện, thời điểm và mục đích sử dụng, khả năng truy vết nguồn gốc của mỗi hành vi truy cập thông qua chuỗi xác thực từ Keycloak đến OPA đến nhật ký ứng dụng, và cơ chế đảm bảo tính toàn vẹn của dữ liệu kiểm toán thông qua Anchor Hash. Việc tuân thủ quyết định này là yêu cầu bắt buộc đối với các cơ sở y tế thực hiện chuyển đổi số theo chủ trương của Bộ Y tế.

### 4.5.4. So sánh với giải pháp SIEM thương mại

So với các giải pháp SIEM thương mại phổ biến như Splunk hoặc IBM QRadar, hệ thống được phát triển trong nghiên cứu này có những ưu điểm và hạn chế riêng phù hợp với bối cảnh cơ sở y tế vừa và nhỏ tại Việt Nam [15]. Về chi phí, hệ thống sử dụng hoàn toàn phần mềm mã nguồn mở nên không phát sinh chi phí bản quyền, trong khi các giải pháp thương mại thường có mức phí từ 50 đến 200 triệu đồng mỗi năm. Về thời gian triển khai, hệ thống có thể được cài đặt và cấu hình trong 2 đến 3 ngày so với 2 đến 4 tuần của các giải pháp thương mại. Về nhân lực vận hành, hệ thống chỉ yêu cầu 1 nhân viên công nghệ thông tin có kiến thức cơ bản so với 2 đến 3 chuyên gia bảo mật của giải pháp thương mại.

Tuy nhiên, hệ thống cũng có những hạn chế so với giải pháp thương mại bao gồm khả năng mở rộng chỉ phù hợp với quy mô SME dưới 10.000 logs mỗi ngày, không tích hợp sẵn các thuật toán học máy để phát hiện anomaly phức tạp, và chỉ có hỗ trợ từ cộng đồng thay vì vendor support 24/7. Những hạn chế này là sự đánh đổi có chủ đích để đạt được mục tiêu về chi phí và khả năng triển khai phù hợp với thực tế nguồn lực của các cơ sở y tế vừa và nhỏ.

## 4.6. Ý nghĩa của kết quả

### 4.6.1. Ý nghĩa thực tiễn cho cơ sở y tế vừa và nhỏ

Kết quả thực nghiệm đã chứng minh rằng một hệ thống giám sát tuân thủ đầy đủ chức năng có thể được xây dựng và triển khai với chi phí bằng không về bản quyền phần mềm, thời gian triển khai ngắn trong vòng 2 đến 3 ngày, và không đòi hỏi chuyên môn cao về bảo mật từ nhân viên vận hành. Đây là những yếu tố quan trọng quyết định khả năng áp dụng thực tế của giải pháp tại các cơ sở y tế vừa và nhỏ tại Việt Nam, nơi nguồn lực về tài chính và nhân lực cho công nghệ thông tin thường bị hạn chế [16].

Kiến trúc non-invasive của hệ thống cho phép triển khai như một lớp giám sát bổ sung mà không cần sửa đổi mã nguồn của hệ thống EHR hiện có. Đặc điểm này đặc biệt quan trọng trong bối cảnh nhiều cơ sở y tế đang sử dụng các phần mềm HIS từ nhiều nhà cung cấp khác nhau với mức độ tùy chỉnh cao. Thay vì yêu cầu từng hệ thống EHR phải tích hợp sẵn chức năng giám sát tuân thủ, giải pháp đề xuất hoạt động độc lập ở tầng gateway và có thể áp dụng cho bất kỳ hệ thống nào tuân thủ giao thức HTTP/HTTPS tiêu chuẩn.

### 4.6.2. Hạn chế và hướng phát triển

Nghiên cứu này có một số hạn chế cần được lưu ý khi đánh giá kết quả. Thứ nhất, toàn bộ dữ liệu sử dụng là dữ liệu mô phỏng do đây là đồ án tốt nghiệp đại học, việc đánh giá với dữ liệu vận hành thực tế của một cơ sở y tế thực là cần thiết trước khi triển khai sản xuất. Thứ hai, độ trễ phát hiện của cơ chế Anchor Hash ở mức 24 giờ có thể chưa đáp ứng được yêu cầu của các cơ sở có mức độ nhạy cảm cao về bảo mật. Thứ ba, hệ thống chưa tích hợp các thuật toán học máy để phát hiện các mẫu hành vi bất thường phức tạp nằm ngoài phạm vi của các quy tắc đã định nghĩa.

Hướng phát triển trong tương lai bao gồm việc tích hợp module học máy để phát hiện anomaly, giảm chu kỳ Anchor Hash xuống mức gần thời gian thực, thực hiện User Acceptance Testing với cơ sở y tế thực, và mở rộng bộ quy tắc để bao phủ thêm các yêu cầu mới từ các văn bản quy phạm pháp luật được ban hành trong tương lai.

## 4.7. Tóm tắt chương

Chương này đã trình bày quá trình thực nghiệm và đánh giá hệ thống giám sát tuân thủ chính sách truy cập hồ sơ bệnh án điện tử với các kết quả chính như sau. Thứ nhất, môi trường thực nghiệm được triển khai thành công trên nền tảng Docker với 18 tài khoản người dùng, 85 hồ sơ bệnh nhân và thu thập được 2.847 bản ghi nhật ký trong 7 ngày vận hành. Thứ hai, hệ thống đạt tỷ lệ tuân thủ tổng thể 93.8% với khả năng phát hiện và phân loại các vi phạm theo từng quy tắc cụ thể có ánh xạ với căn cứ pháp lý tương ứng. Thứ ba, thành phần Keycloak xử lý xác thực hiệu quả với tỷ lệ thành công 95.5% và phát hiện 100% các tình huống brute-force được mô phỏng. Thứ tư, cơ chế Anchor Hash phát hiện thành công 100% các kịch bản can thiệp nhật ký được mô phỏng với độ trễ tối đa 24 giờ. Thứ năm, hệ thống đáp ứng các yêu cầu của Thông tư 46/2018/TT-BYT và phần lớn khuyến nghị của NIST SP 800-92 về quản lý nhật ký bảo mật. Thứ sáu, với chi phí bản quyền bằng không, thời gian triển khai 2 đến 3 ngày và không đòi hỏi chuyên môn cao, giải pháp phù hợp với điều kiện thực tế của các cơ sở y tế vừa và nhỏ tại Việt Nam.

## Tài liệu tham khảo

[1] Bộ Y tế, "Thông tư 46/2018/TT-BYT Quy định hồ sơ bệnh án điện tử," 2018. [Online]. Available: https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-46-2018-TT-BYT-quy-dinh-ho-so-benh-an-dien-tu-398230.aspx

[2] Chính phủ Việt Nam, "Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân," 2023. [Online]. Available: https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Nghi-dinh-13-2023-ND-CP-bao-ve-du-lieu-ca-nhan-465185.aspx

[3] Quốc hội Việt Nam, "Luật Khám bệnh, Chữa bệnh 2023," 2023. [Online]. Available: https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Luat-kham-benh-chua-benh-2023-23-2023-QH15-537474.aspx

[4] A. Barth, J. C. Mitchell, and J. Rosenstein, "A logic for reasoning about access control," in Proc. IEEE Symposium on Security and Privacy, 2007, pp. 205-219.

[5] Docker Inc., "Docker Compose Overview," 2024. [Online]. Available: https://docs.docker.com/compose/

[6] K. D. Mandl et al., "Open-source approaches to electronic health records," Healthcare, vol. 2, no. 3, pp. 161-166, 2014.

[7] Red Hat, "Keycloak Documentation," 2024. [Online]. Available: https://www.keycloak.org/documentation

[8] Open Policy Agent, "Policy Language," 2024. [Online]. Available: https://www.openpolicyagent.org/docs/latest/policy-language/

[9] J. Park and R. Sandhu, "The UCONABC usage control model," ACM Trans. Inf. Syst. Secur., vol. 7, no. 1, pp. 128-174, 2004.

[10] NIST, "Digital Identity Guidelines," NIST SP 800-63B, 2020. [Online]. Available: https://csrc.nist.gov/publications/detail/sp/800-63b/final

[11] V. C. Hu et al., "Guide to Attribute Based Access Control (ABAC) Definition and Considerations," NIST SP 800-162, 2014.

[12] V. C. Hu et al., "Attribute Based Access Control," NIST SP 800-162, 2019. [Online]. Available: https://csrc.nist.gov/publications/detail/sp/800-162/final

[13] HIPAA Journal, "HIPAA Audit Log Requirements," 2023. [Online]. Available: https://www.hipaajournal.com/

[14] K. Kent and M. Souppaya, "Guide to Computer Security Log Management," NIST SP 800-92, 2006.

[15] Gartner, "Magic Quadrant for Security Information and Event Management," 2023.

[16] World Health Organization, "Digital health in the context of health sector reform," 2021.

[17] Bộ Y tế, "Quyết định 326/QĐ-BYT về tiêu chuẩn kiểm toán an ninh y tế," 2024.
