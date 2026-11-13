package com.mobinest.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

/** Swagger UI at http://localhost:8080/swagger-ui.html */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI mobinestOpenApi() {
        return new OpenAPI()
            .info(new Info().title("MobiNest API").version("v1")
                .description("Catalogue, checkout and orders for the MobiNest mobile phone store."))
            .components(new Components().addSecuritySchemes("clerk",
                new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                    .description("Clerk session token (from getToken() in the React app)")));
    }
}
