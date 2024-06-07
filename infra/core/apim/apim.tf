resource "azurerm_api_management" "api" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resourceGroupName
  publisher_email     = var.publisher_email
  publisher_name      = var.publisher_name
  sku_name            = "${var.sku}_${var.sku_count}"
}
