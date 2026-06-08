# Database ERD

```mermaid
erDiagram
    USER {
        String id PK
        String email
        String password
        String name
        String role
        DateTime createdAt
    }

    CUSTOMER {
        String id PK
        String name
        String email
        String phone
        String address
        DateTime createdAt
    }

    INVOICE {
        String id PK
        String invoiceNo
        String status
        DateTime issueDate
        DateTime dueDate
        String customerId FK
        Float subTotal
        Float taxTotal
        Float grandTotal
        DateTime createdAt
    }

    INVOICE_ITEM {
        String id PK
        String invoiceId FK
        String description
        Int quantity
        Float price
        Float total
    }

    CUSTOMER ||--o{ INVOICE : "has"
    INVOICE ||--o{ INVOICE_ITEM : "contains"
    USER ..||.. USER : "system users"
```

This ERD is generated from `apps/backend/prisma/schema.prisma` and represents the primary relations:
- One Customer -> Many Invoices
- One Invoice -> Many InvoiceItems
