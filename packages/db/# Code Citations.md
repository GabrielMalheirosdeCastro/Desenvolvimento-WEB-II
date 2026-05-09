# Code Citations

## License: unknown
https://github.com/eirikff/config/blob/b7629452092bb3e15aa147e3f31d813df44b0442/linux/install.sh

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao
```


## License: unknown
https://github.com/eirikff/config/blob/b7629452092bb3e15aa147e3f31d813df44b0442/linux/install.sh

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao
```


## License: Apache-2.0
https://github.com/jgibbons-cp/datadog/blob/361c2846b793eca19a821402dce2a792f0bcb4f3/kubernetes/kubeadm/install_control_plane.sh

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker
```


## License: Apache-2.0
https://github.com/fancyerii/fancyerii.github.io/blob/d497a1b8a2b62af7b1932477cc0d311ac346c536/_posts/2024-02-16-docker-py-debug.md

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```


## License: GPL-3.0
https://github.com/wang-junjian/wang-junjian.github.io/blob/41bb0788ef9e6e81c80a62192d0771f6d7a9adc5/_posts/2024-01-10-Deploying-Tabby-AI-Coding-Assistant-on-GeForce-GTX-1060.markdown

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```


## License: Apache-2.0
https://github.com/jgibbons-cp/datadog/blob/361c2846b793eca19a821402dce2a792f0bcb4f3/kubernetes/kubeadm/install_control_plane.sh

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker
```


## License: Apache-2.0
https://github.com/fancyerii/fancyerii.github.io/blob/d497a1b8a2b62af7b1932477cc0d311ac346c536/_posts/2024-02-16-docker-py-debug.md

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```


## License: GPL-3.0
https://github.com/wang-junjian/wang-junjian.github.io/blob/41bb0788ef9e6e81c80a62192d0771f6d7a9adc5/_posts/2024-01-10-Deploying-Tabby-AI-Coding-Assistant-on-GeForce-GTX-1060.markdown

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```


## License: Apache-2.0
https://github.com/fancyerii/fancyerii.github.io/blob/d497a1b8a2b62af7b1932477cc0d311ac346c536/_posts/2024-02-16-docker-py-debug.md

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```


## License: GPL-3.0
https://github.com/wang-junjian/wang-junjian.github.io/blob/41bb0788ef9e6e81c80a62192d0771f6d7a9adc5/_posts/2024-01-10-Deploying-Tabby-AI-Coding-Assistant-on-GeForce-GTX-1060.markdown

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```


## License: Apache-2.0
https://github.com/jgibbons-cp/datadog/blob/361c2846b793eca19a821402dce2a792f0bcb4f3/kubernetes/kubeadm/install_control_plane.sh

```
## Análise da VM Azure

**Especificações identificadas:**
| Campo | Valor |
|-------|-------|
| Sistema Operacional | Ubuntu 24.04 LTS |
| Tamanho | Standard D2s v3 (2 vCPUs, 8 GiB RAM) |
| IP Público | `20.98.154.142` |
| IP Privado | `10.0.0.4` |
| Região | Central US (Zona 1) |
| Assinatura | Azure for Students |
| Tag | `ambiente: teste` |

---

## Instalação do Docker no Ubuntu 24.04

### 1. Conectar via SSH
```bash
ssh azureuser@20.98.154.142
```
> Substitua `azureuser` pelo usuário configurado na criação da VM.

---

### 2. Remover versões antigas (se existirem)
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

---

### 3. Adicionar o repositório oficial do Docker
```bash
# Atualizar pacotes e instalar dependências
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Adicionar a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório ao sources.list
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

---

### 4. Instalar o Docker Engine
```bash
sudo apt-get install -y \
  docker-ce \
```

