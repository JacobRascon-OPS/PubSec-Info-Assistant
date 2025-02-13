variable "name" {
  type = string
}

variable "vnetLinks" {
  type = list(object({
    name = string
    vnetId = string
  }))
}

variable "resourceGroupName" {
  type = string
}

variable "tags" {
  type = map(string)
}
