variable "logAnalyticsName" {
  type    = string
}

variable "location" {
  type    = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "skuName" {
  type    = string
  default = "PerGB2018"
}

variable "serviceResourceGroupName" {
  type    = string
}

variable "logWorkbookName" {
  description = "The name of the log workbook"
  type        = string
  default     = ""
}

variable "componentResource" {
  description = "The component resource"
  type        = string
  default     = ""
}
