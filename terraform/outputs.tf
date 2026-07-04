output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "db_endpoint" {
  description = "The connection endpoint for the RDS database"
  value       = module.db.db_instance_endpoint
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}
