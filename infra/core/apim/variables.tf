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
    type = "string"
}

variable "tags"{
    type=object
}

variable "resourceGroupName" {
  type=string
}