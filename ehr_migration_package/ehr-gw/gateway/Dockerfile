FROM openresty/openresty:alpine

# Timezone setup for Alpine
ENV TZ=Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime \
    && echo "Asia/Ho_Chi_Minh" > /etc/timezone

# Cần cho opm
RUN apk add --no-cache perl curl ca-certificates && update-ca-certificates

# Cài lua-resty-http để Lua gọi OPA qua HTTP
RUN opm get ledgetech/lua-resty-http

# context = gateway/, dùng đường dẫn nội bộ
# Copy nginx.conf vào image thay vì bind-mount
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

COPY lua/opa_auth.lua /etc/nginx/lua/opa_auth.lua
COPY lua/waf_filter.lua /etc/nginx/lua/waf_filter.lua
COPY coraza/coraza.conf /etc/nginx/coraza.conf
RUN mkdir -p /usr/local/openresty/nginx/html/tester /var/log/coraza
COPY www/index.html /usr/local/openresty/nginx/html/tester/index.html
