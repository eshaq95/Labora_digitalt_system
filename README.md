flowchart LR
    %% Noder
    A[1. INNKJØP]:::flow
    B[2. VAREMOTTAK]:::flow
    C{3. LAGERSTYRING<br/>(Kjernen)}:::core
    D[4. VAREUTTAK]:::flow
    E[5. VARETELLING & KONTROLL]:::flow

    subgraph FOUNDATION [SYSTEMETS GRUNNMUR & RESULTATER]
        F1[Varekartotek]:::foundation
        F2[Leverandørregister]:::foundation
        F3[Lokasjoner & Brukere]:::foundation
        F4[RAPPORTERING & SPORBARHET]:::output
    end

    %% Flyt
    A -->|Bestilling| B
    B -->|Inn på lager| C
    C -->|Forbruk| D
    D -->|Oppdaterer beholdning| C
    C -->|Kontroll| E
    E -->|Justeringer| C
    C -.->|Automatisk påfylling| A

    %% Grunnmur forbindelser
    F1 -.-> C
    F2 -.-> C
    F3 -.-> C
    F4 -.-> C

    %% Stiler
    classDef flow fill:#E0F2FE,stroke:#0369A1,stroke-width:2px,color:#111827,font-weight:600;
    classDef core fill:#FEF9C3,stroke:#D97706,stroke-width:3px,color:#111827,font-weight:700;
    classDef foundation fill:#F3F4F6,stroke:#6B7280,stroke-width:1.5px,color:#111827,font-weight:500;
    classDef output fill:#DCFCE7,stroke:#15803D,stroke-width:2px,color:#111827,font-weight:600;
