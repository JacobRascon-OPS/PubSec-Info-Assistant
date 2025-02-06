variable "name" {
  type=string
}

variable "publisher_email" {
  type = string
}

variable "publisher_name" {
  type = string
}

variable "sku" {
  type = string
}

variable "sku_count" {
  type = number
}

variable "location" {
    type = string
}

variable "tags"{
    type=map(string)
}

variable "resourceGroupName" {
  type=string
}

variable "policyFragments" {
  type = list
  
}

variable "backendName" {
  type=string
}

variable "backendUrl" {
  type = string
  
}

variable "basePolicyContent" {
  type = string
  
}

variable "apiName" {
  type = string
  
}

variable "apiContent" {
  type=string
}

variable "nameValues" {
  type = list
  default = []
}

variable "operationPolicies" {
  type = list
  default = []
}


variable "is_secure_mode" {
  type    = bool
  default = false
}

variable "private_dns_zone_ids" {
  type = set(string)
}

variable "vnet_name" {
  type = string
}

variable "subnet_name" {
  type = string
}
