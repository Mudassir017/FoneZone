package com.mobinest.admin.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mobinest.customer.Customer;
import com.mobinest.customer.Customer.Role;

public interface AdminCustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

    long countByRole(Role role);
}
