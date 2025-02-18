resource "azurerm_virtual_network_peering" "vnet_1" {
  name                      = "${var.vnet_name}_x_hub"
  resource_group_name       = var.networkResourceGroupName
  virtual_network_name      = var.vnet_name
  remote_virtual_network_id = var.remoteVnetId

  allow_forwarded_traffic = true
  allow_virtual_network_access = true

}

