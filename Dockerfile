FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    clang \
    llvm \
    linux-headers-generic \
    libssl-dev \
    pkg-config \
    curl \
    git \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Install LLVM/Clang for eBPF
RUN apt-get install -y clang-14 && \
    update-alternatives --install /usr/bin/clang clang /usr/bin/clang-14 100 && \
    update-alternatives --install /usr/bin/llc llc /usr/bin/llc-14 100

WORKDIR /app

# Copy source
COPY . /app

# Build TypeScript
RUN npm install && npm run build

# Compile eBPF kernel module
RUN cd kernel && \
    clang -O2 -target bpf -c vøid_ebpf.c -o vøid_ebpf.o && \
    llvm-objdump -S vøid_ebpf.o > vøid_ebpf.ll

# Verify build
RUN test -f dist/index.html && \
    test -f kernel/vøid_ebpf.o && \
    test -f dist/assets/*.wasm

EXPOSE 3000 9000 50051

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run
CMD ["node", "dist/server.js"]
