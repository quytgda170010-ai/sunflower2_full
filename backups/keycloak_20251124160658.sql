--
-- PostgreSQL database dump
--

\restrict 0t22MHSUH466lgsKtSjTqJWQZu3Ok5ywakbKDNTiLSWwTx2wEIQKMAD4ShQwgqI

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_event_entity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64)
);


ALTER TABLE public.admin_event_entity OWNER TO keycloak;

--
-- Name: associated_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


ALTER TABLE public.associated_policy OWNER TO keycloak;

--
-- Name: authentication_execution; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


ALTER TABLE public.authentication_execution OWNER TO keycloak;

--
-- Name: authentication_flow; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


ALTER TABLE public.authentication_flow OWNER TO keycloak;

--
-- Name: authenticator_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.authenticator_config OWNER TO keycloak;

--
-- Name: authenticator_config_entry; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.authenticator_config_entry OWNER TO keycloak;

--
-- Name: broker_link; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


ALTER TABLE public.broker_link OWNER TO keycloak;

--
-- Name: client; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client OWNER TO keycloak;

--
-- Name: client_attributes; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.client_attributes OWNER TO keycloak;

--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


ALTER TABLE public.client_auth_flow_bindings OWNER TO keycloak;

--
-- Name: client_initial_access; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


ALTER TABLE public.client_initial_access OWNER TO keycloak;

--
-- Name: client_node_registrations; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_node_registrations OWNER TO keycloak;

--
-- Name: client_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


ALTER TABLE public.client_scope OWNER TO keycloak;

--
-- Name: client_scope_attributes; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_scope_attributes OWNER TO keycloak;

--
-- Name: client_scope_client; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client_scope_client OWNER TO keycloak;

--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.client_scope_role_mapping OWNER TO keycloak;

--
-- Name: client_session; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_session (
    id character varying(36) NOT NULL,
    client_id character varying(36),
    redirect_uri character varying(255),
    state character varying(255),
    "timestamp" integer,
    session_id character varying(36),
    auth_method character varying(255),
    realm_id character varying(255),
    auth_user_id character varying(36),
    current_action character varying(36)
);


ALTER TABLE public.client_session OWNER TO keycloak;

--
-- Name: client_session_auth_status; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_session_auth_status (
    authenticator character varying(36) NOT NULL,
    status integer,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_auth_status OWNER TO keycloak;

--
-- Name: client_session_note; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_session_note (
    name character varying(255) NOT NULL,
    value character varying(255),
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_note OWNER TO keycloak;

--
-- Name: client_session_prot_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_session_prot_mapper (
    protocol_mapper_id character varying(36) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_prot_mapper OWNER TO keycloak;

--
-- Name: client_session_role; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_session_role (
    role_id character varying(255) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_role OWNER TO keycloak;

--
-- Name: client_user_session_note; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_user_session_note (
    name character varying(255) NOT NULL,
    value character varying(2048),
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_user_session_note OWNER TO keycloak;

--
-- Name: component; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


ALTER TABLE public.component OWNER TO keycloak;

--
-- Name: component_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.component_config OWNER TO keycloak;

--
-- Name: composite_role; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


ALTER TABLE public.composite_role OWNER TO keycloak;

--
-- Name: credential; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.credential OWNER TO keycloak;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE public.databasechangelog OWNER TO keycloak;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE public.databasechangeloglock OWNER TO keycloak;

--
-- Name: default_client_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.default_client_scope OWNER TO keycloak;

--
-- Name: event_entity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


ALTER TABLE public.event_entity OWNER TO keycloak;

--
-- Name: fed_user_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024)
);


ALTER TABLE public.fed_user_attribute OWNER TO keycloak;

--
-- Name: fed_user_consent; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.fed_user_consent OWNER TO keycloak;

--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.fed_user_consent_cl_scope OWNER TO keycloak;

--
-- Name: fed_user_credential; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.fed_user_credential OWNER TO keycloak;

--
-- Name: fed_user_group_membership; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_group_membership OWNER TO keycloak;

--
-- Name: fed_user_required_action; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_required_action OWNER TO keycloak;

--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_role_mapping OWNER TO keycloak;

--
-- Name: federated_identity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_identity OWNER TO keycloak;

--
-- Name: federated_user; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_user OWNER TO keycloak;

--
-- Name: group_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_attribute OWNER TO keycloak;

--
-- Name: group_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_role_mapping OWNER TO keycloak;

--
-- Name: identity_provider; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL
);


ALTER TABLE public.identity_provider OWNER TO keycloak;

--
-- Name: identity_provider_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.identity_provider_config OWNER TO keycloak;

--
-- Name: identity_provider_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.identity_provider_mapper OWNER TO keycloak;

--
-- Name: idp_mapper_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.idp_mapper_config OWNER TO keycloak;

--
-- Name: keycloak_group; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36)
);


ALTER TABLE public.keycloak_group OWNER TO keycloak;

--
-- Name: keycloak_role; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


ALTER TABLE public.keycloak_role OWNER TO keycloak;

--
-- Name: migration_model; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.migration_model OWNER TO keycloak;

--
-- Name: offline_client_session; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL
);


ALTER TABLE public.offline_client_session OWNER TO keycloak;

--
-- Name: offline_user_session; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.offline_user_session OWNER TO keycloak;

--
-- Name: policy_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.policy_config OWNER TO keycloak;

--
-- Name: protocol_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


ALTER TABLE public.protocol_mapper OWNER TO keycloak;

--
-- Name: protocol_mapper_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.protocol_mapper_config OWNER TO keycloak;

--
-- Name: realm; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


ALTER TABLE public.realm OWNER TO keycloak;

--
-- Name: realm_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


ALTER TABLE public.realm_attribute OWNER TO keycloak;

--
-- Name: realm_default_groups; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_default_groups OWNER TO keycloak;

--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_enabled_event_types OWNER TO keycloak;

--
-- Name: realm_events_listeners; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_events_listeners OWNER TO keycloak;

--
-- Name: realm_localizations; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


ALTER TABLE public.realm_localizations OWNER TO keycloak;

--
-- Name: realm_required_credential; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_required_credential OWNER TO keycloak;

--
-- Name: realm_smtp_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.realm_smtp_config OWNER TO keycloak;

--
-- Name: realm_supported_locales; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_supported_locales OWNER TO keycloak;

--
-- Name: redirect_uris; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.redirect_uris OWNER TO keycloak;

--
-- Name: required_action_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.required_action_config OWNER TO keycloak;

--
-- Name: required_action_provider; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


ALTER TABLE public.required_action_provider OWNER TO keycloak;

--
-- Name: resource_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_attribute OWNER TO keycloak;

--
-- Name: resource_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_policy OWNER TO keycloak;

--
-- Name: resource_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_scope OWNER TO keycloak;

--
-- Name: resource_server; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.resource_server OWNER TO keycloak;

--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


ALTER TABLE public.resource_server_perm_ticket OWNER TO keycloak;

--
-- Name: resource_server_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


ALTER TABLE public.resource_server_policy OWNER TO keycloak;

--
-- Name: resource_server_resource; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_resource OWNER TO keycloak;

--
-- Name: resource_server_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_scope OWNER TO keycloak;

--
-- Name: resource_uris; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.resource_uris OWNER TO keycloak;

--
-- Name: role_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.role_attribute OWNER TO keycloak;

--
-- Name: scope_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_mapping OWNER TO keycloak;

--
-- Name: scope_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_policy OWNER TO keycloak;

--
-- Name: user_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL
);


ALTER TABLE public.user_attribute OWNER TO keycloak;

--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.user_consent OWNER TO keycloak;

--
-- Name: user_consent_client_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.user_consent_client_scope OWNER TO keycloak;

--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_entity OWNER TO keycloak;

--
-- Name: user_federation_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_config OWNER TO keycloak;

--
-- Name: user_federation_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.user_federation_mapper OWNER TO keycloak;

--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_mapper_config OWNER TO keycloak;

--
-- Name: user_federation_provider; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.user_federation_provider OWNER TO keycloak;

--
-- Name: user_group_membership; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_group_membership OWNER TO keycloak;

--
-- Name: user_required_action; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


ALTER TABLE public.user_required_action OWNER TO keycloak;

--
-- Name: user_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_role_mapping OWNER TO keycloak;

--
-- Name: user_session; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_session (
    id character varying(36) NOT NULL,
    auth_method character varying(255),
    ip_address character varying(255),
    last_session_refresh integer,
    login_username character varying(255),
    realm_id character varying(255),
    remember_me boolean DEFAULT false NOT NULL,
    started integer,
    user_id character varying(255),
    user_session_state integer,
    broker_session_id character varying(255),
    broker_user_id character varying(255)
);


ALTER TABLE public.user_session OWNER TO keycloak;

--
-- Name: user_session_note; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_session_note (
    user_session character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(2048)
);


ALTER TABLE public.user_session_note OWNER TO keycloak;

--
-- Name: username_login_failure; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.username_login_failure (
    realm_id character varying(36) NOT NULL,
    username character varying(255) NOT NULL,
    failed_login_not_before integer,
    last_failure bigint,
    last_ip_failure character varying(255),
    num_failures integer
);


ALTER TABLE public.username_login_failure OWNER TO keycloak;

--
-- Name: web_origins; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.web_origins OWNER TO keycloak;

--
-- Data for Name: admin_event_entity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.admin_event_entity (id, admin_event_time, realm_id, operation_type, auth_realm_id, auth_client_id, auth_user_id, ip_address, resource_path, representation, error, resource_type) FROM stdin;
\.


--
-- Data for Name: associated_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.associated_policy (policy_id, associated_policy_id) FROM stdin;
\.


--
-- Data for Name: authentication_execution; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authentication_execution (id, alias, authenticator, realm_id, flow_id, requirement, priority, authenticator_flow, auth_flow_id, auth_config) FROM stdin;
665b5ea3-a7a5-4317-8ac7-14a52e207547	\N	auth-cookie	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	7fe234ba-d9e7-4b41-9511-45331ff663d1	2	10	f	\N	\N
e9299c2e-6938-4ab5-a907-84312a9e8f76	\N	auth-spnego	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	7fe234ba-d9e7-4b41-9511-45331ff663d1	3	20	f	\N	\N
c79f62d3-47d0-4271-a6d1-6fd61be3f3d6	\N	identity-provider-redirector	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	7fe234ba-d9e7-4b41-9511-45331ff663d1	2	25	f	\N	\N
76855435-df39-4959-abec-8fe802113eb8	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	7fe234ba-d9e7-4b41-9511-45331ff663d1	2	30	t	56c7b820-b3ed-4786-acc4-95b3daa0b126	\N
e29ec8bf-6892-41e3-bfbe-79758c4889e2	\N	auth-username-password-form	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	56c7b820-b3ed-4786-acc4-95b3daa0b126	0	10	f	\N	\N
d454a781-4b82-4b76-9bdd-2efd0ad61c6c	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	56c7b820-b3ed-4786-acc4-95b3daa0b126	1	20	t	78ec2511-d2b8-4ca5-9d1b-492b5ddb29ab	\N
398a20df-23ae-41e8-b9ec-d819b39e997b	\N	conditional-user-configured	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	78ec2511-d2b8-4ca5-9d1b-492b5ddb29ab	0	10	f	\N	\N
4632eedd-91a2-4148-bf1e-33a52360252a	\N	auth-otp-form	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	78ec2511-d2b8-4ca5-9d1b-492b5ddb29ab	0	20	f	\N	\N
d9b283e7-170b-4ce2-89ad-bad829e1c344	\N	direct-grant-validate-username	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	9826ac06-9181-4a8e-9cc9-803a5bcb24e1	0	10	f	\N	\N
c7ef72f1-7356-4049-ad4f-a234b9ad07f5	\N	direct-grant-validate-password	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	9826ac06-9181-4a8e-9cc9-803a5bcb24e1	0	20	f	\N	\N
a0fedb79-c34f-40ab-9fc4-e6c7bc643bf4	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	9826ac06-9181-4a8e-9cc9-803a5bcb24e1	1	30	t	3cc21b7c-f7ea-4c14-b330-37a1263de288	\N
bbe2d23c-378c-4c72-9f8d-d8d46f9eae96	\N	conditional-user-configured	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	3cc21b7c-f7ea-4c14-b330-37a1263de288	0	10	f	\N	\N
ce90b77d-8d56-498e-8573-98e7f71f707a	\N	direct-grant-validate-otp	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	3cc21b7c-f7ea-4c14-b330-37a1263de288	0	20	f	\N	\N
00f7b845-360d-4338-a04b-3c50fe2a4ed6	\N	registration-page-form	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	86418ba0-1724-4c71-bb4e-552ee9d261b4	0	10	t	ceaf2317-fa56-4892-bec1-de797c80e9a7	\N
18cbc464-a579-44d4-9d11-1338682ad9d8	\N	registration-user-creation	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	ceaf2317-fa56-4892-bec1-de797c80e9a7	0	20	f	\N	\N
8d82540c-9466-4bf5-b67f-422c5d080d3e	\N	registration-password-action	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	ceaf2317-fa56-4892-bec1-de797c80e9a7	0	50	f	\N	\N
80d2f320-5569-4418-aa51-8ad2dcee6093	\N	registration-recaptcha-action	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	ceaf2317-fa56-4892-bec1-de797c80e9a7	3	60	f	\N	\N
03fdaeeb-da62-449f-ba07-b8d6a0c88841	\N	registration-terms-and-conditions	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	ceaf2317-fa56-4892-bec1-de797c80e9a7	3	70	f	\N	\N
ba1a9cb5-7975-4b83-86bb-5740efab17cc	\N	reset-credentials-choose-user	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	62cdea4e-8f0e-40a0-83f3-4bb8b86385ba	0	10	f	\N	\N
9b6bbd4f-2377-445b-922c-5b17ec8fd58e	\N	reset-credential-email	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	62cdea4e-8f0e-40a0-83f3-4bb8b86385ba	0	20	f	\N	\N
ca99895e-f04e-454e-b15f-31865c38d615	\N	reset-password	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	62cdea4e-8f0e-40a0-83f3-4bb8b86385ba	0	30	f	\N	\N
564a4acb-e5aa-4b26-88e4-ae36a06632cb	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	62cdea4e-8f0e-40a0-83f3-4bb8b86385ba	1	40	t	8f63af60-2d0f-4304-b315-420067c28dc5	\N
7d1c1bae-bac2-4b32-be86-985bb5ccb199	\N	conditional-user-configured	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	8f63af60-2d0f-4304-b315-420067c28dc5	0	10	f	\N	\N
4e0744ad-2699-4778-9a64-ba4e2b916989	\N	reset-otp	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	8f63af60-2d0f-4304-b315-420067c28dc5	0	20	f	\N	\N
090d69ea-c7ea-445d-a5d5-51187d1e2a02	\N	client-secret	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	97f4ef24-5c21-4d64-8463-5cb4422548cd	2	10	f	\N	\N
5dabcdba-0daa-411e-882a-d9a24b0965fe	\N	client-jwt	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	97f4ef24-5c21-4d64-8463-5cb4422548cd	2	20	f	\N	\N
5d6d3d53-cef0-4b33-b33d-dbbc347896a2	\N	client-secret-jwt	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	97f4ef24-5c21-4d64-8463-5cb4422548cd	2	30	f	\N	\N
3527290a-6ee0-4d93-8ad5-af707a018ea2	\N	client-x509	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	97f4ef24-5c21-4d64-8463-5cb4422548cd	2	40	f	\N	\N
705e09d5-a157-4e33-8260-7fb0a95b8c99	\N	idp-review-profile	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	cd74b1af-5d26-4190-b42e-bc738bd58306	0	10	f	\N	755975a0-c04e-4600-8203-76392022c56c
474cb1e0-35a3-4301-909b-410742622cab	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	cd74b1af-5d26-4190-b42e-bc738bd58306	0	20	t	48f9438b-39a4-4697-82e0-371ea6252e89	\N
cd43d423-8cf3-40ee-93b5-e23f4d1b22fd	\N	idp-create-user-if-unique	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	48f9438b-39a4-4697-82e0-371ea6252e89	2	10	f	\N	e3414a4a-a3a0-4afb-93ca-11f48fba7fc5
6ef3a503-31cc-4b48-a1c4-85f8d462eb3d	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	48f9438b-39a4-4697-82e0-371ea6252e89	2	20	t	58a0b1ec-f7e1-4736-a4a1-3bf28fd65925	\N
caf9bc8d-0a11-487f-8e4d-785a56c71938	\N	idp-confirm-link	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	58a0b1ec-f7e1-4736-a4a1-3bf28fd65925	0	10	f	\N	\N
bfac5eb4-fbf5-473f-99b5-ee18dd6248e5	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	58a0b1ec-f7e1-4736-a4a1-3bf28fd65925	0	20	t	55569894-9383-4bb9-b447-700c9eee6006	\N
f103cd63-e7e3-469c-bb38-47aa48861866	\N	idp-email-verification	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	55569894-9383-4bb9-b447-700c9eee6006	2	10	f	\N	\N
ddcb853d-754f-4e08-9aa4-25817127a561	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	55569894-9383-4bb9-b447-700c9eee6006	2	20	t	d0f63671-f36d-47b3-8b09-3831a0cda36b	\N
54343d39-8d84-4ac9-9192-56a8ffeb8b8b	\N	idp-username-password-form	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	d0f63671-f36d-47b3-8b09-3831a0cda36b	0	10	f	\N	\N
fef99980-50a8-4787-b477-fd47d8fea708	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	d0f63671-f36d-47b3-8b09-3831a0cda36b	1	20	t	beb2afd5-70df-4a0b-8c9c-2560719952fd	\N
896cf861-3b6a-4dfd-905c-8e79febcd6ac	\N	conditional-user-configured	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	beb2afd5-70df-4a0b-8c9c-2560719952fd	0	10	f	\N	\N
be45ca3c-4423-47cc-9926-874ef9dd78d0	\N	auth-otp-form	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	beb2afd5-70df-4a0b-8c9c-2560719952fd	0	20	f	\N	\N
5d42e14f-a7a1-482e-b6cd-7f129861e754	\N	http-basic-authenticator	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e207eb7d-4f47-4003-9f76-4a02450a321d	0	10	f	\N	\N
29eea25c-3936-49e4-930f-b4d890a45f6b	\N	docker-http-basic-authenticator	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	66d74419-fb33-4573-a12f-59e460338ceb	0	10	f	\N	\N
88c9070c-60e0-474b-87d2-4972a84589cc	\N	auth-cookie	39799f2c-4662-4089-918d-99875bb5d615	90ebf45b-3c5c-4469-8625-859215281b41	2	10	f	\N	\N
49ea842f-3a03-44f8-b823-4d4df6513c4e	\N	auth-spnego	39799f2c-4662-4089-918d-99875bb5d615	90ebf45b-3c5c-4469-8625-859215281b41	3	20	f	\N	\N
40283c39-ab78-426c-96e5-b7bb08d4c3b0	\N	identity-provider-redirector	39799f2c-4662-4089-918d-99875bb5d615	90ebf45b-3c5c-4469-8625-859215281b41	2	25	f	\N	\N
3668f2c0-a134-46cc-9162-d1d6ad6cea27	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	90ebf45b-3c5c-4469-8625-859215281b41	2	30	t	2101400c-52de-49bf-96ef-de594e68ba97	\N
e8cac052-14c4-497e-aeaa-be4aec823ddb	\N	auth-username-password-form	39799f2c-4662-4089-918d-99875bb5d615	2101400c-52de-49bf-96ef-de594e68ba97	0	10	f	\N	\N
c77d6a59-540b-4733-ba70-6b70818b1e3c	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	2101400c-52de-49bf-96ef-de594e68ba97	1	20	t	41b8705c-76e5-4387-ab6f-857f478aa558	\N
f0ab5e5a-feef-403e-be05-fbea31dc27ce	\N	conditional-user-configured	39799f2c-4662-4089-918d-99875bb5d615	41b8705c-76e5-4387-ab6f-857f478aa558	0	10	f	\N	\N
ac5b3f8c-9d82-428e-9715-30651b9e2a88	\N	auth-otp-form	39799f2c-4662-4089-918d-99875bb5d615	41b8705c-76e5-4387-ab6f-857f478aa558	0	20	f	\N	\N
2a1735ac-a4dc-4635-85da-a5879fdcbb43	\N	direct-grant-validate-username	39799f2c-4662-4089-918d-99875bb5d615	28251dec-7cd3-4e9c-a986-d9a83c93a9ac	0	10	f	\N	\N
34e69fff-a1db-42da-a39e-696faba9cb85	\N	direct-grant-validate-password	39799f2c-4662-4089-918d-99875bb5d615	28251dec-7cd3-4e9c-a986-d9a83c93a9ac	0	20	f	\N	\N
3eb1fdc9-af90-4647-a729-39db3557c840	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	28251dec-7cd3-4e9c-a986-d9a83c93a9ac	1	30	t	e8c6d5e4-942a-4233-a0d6-b35cceb312d6	\N
198a4d35-aaa9-46c7-a285-8d83afb871fc	\N	conditional-user-configured	39799f2c-4662-4089-918d-99875bb5d615	e8c6d5e4-942a-4233-a0d6-b35cceb312d6	0	10	f	\N	\N
428621b4-02ec-45ec-a149-24a6f458d09e	\N	direct-grant-validate-otp	39799f2c-4662-4089-918d-99875bb5d615	e8c6d5e4-942a-4233-a0d6-b35cceb312d6	0	20	f	\N	\N
62903d51-c8ff-415b-9951-5737e09e9750	\N	registration-page-form	39799f2c-4662-4089-918d-99875bb5d615	131d9af7-e015-4dfa-a39c-89a3b7870e9c	0	10	t	0a0dc57e-b08d-4c09-9fa0-443a59f990f3	\N
84b4ad17-4b68-4f75-ba0c-8540d0482c2f	\N	registration-user-creation	39799f2c-4662-4089-918d-99875bb5d615	0a0dc57e-b08d-4c09-9fa0-443a59f990f3	0	20	f	\N	\N
96f3efc6-cbce-4c1b-bd2b-3fecbcf65a6a	\N	registration-password-action	39799f2c-4662-4089-918d-99875bb5d615	0a0dc57e-b08d-4c09-9fa0-443a59f990f3	0	50	f	\N	\N
34043bd9-0e39-4c98-a56a-ad56552e8ee1	\N	registration-recaptcha-action	39799f2c-4662-4089-918d-99875bb5d615	0a0dc57e-b08d-4c09-9fa0-443a59f990f3	3	60	f	\N	\N
3746506f-e2ac-4479-9c8b-b5760fb3a211	\N	reset-credentials-choose-user	39799f2c-4662-4089-918d-99875bb5d615	47730fd5-8d4a-4cdc-87a5-d5e5d9f4c03e	0	10	f	\N	\N
93572016-2387-4e40-92ed-faace2fb7cc2	\N	reset-credential-email	39799f2c-4662-4089-918d-99875bb5d615	47730fd5-8d4a-4cdc-87a5-d5e5d9f4c03e	0	20	f	\N	\N
d4609565-94a2-42f0-b57a-2eb6e7c1991e	\N	reset-password	39799f2c-4662-4089-918d-99875bb5d615	47730fd5-8d4a-4cdc-87a5-d5e5d9f4c03e	0	30	f	\N	\N
6d8acf25-6e15-419e-a3b7-b281e18dd262	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	47730fd5-8d4a-4cdc-87a5-d5e5d9f4c03e	1	40	t	17c1e16a-d0a1-4688-8556-2b169a016463	\N
b3e4d4ac-d81b-4ead-bcc4-7664e05ac5b9	\N	conditional-user-configured	39799f2c-4662-4089-918d-99875bb5d615	17c1e16a-d0a1-4688-8556-2b169a016463	0	10	f	\N	\N
166b65d1-cfe1-4063-a1ec-2094965f4e85	\N	reset-otp	39799f2c-4662-4089-918d-99875bb5d615	17c1e16a-d0a1-4688-8556-2b169a016463	0	20	f	\N	\N
def0e35f-c34f-4729-8be4-0583a17c9b67	\N	client-secret	39799f2c-4662-4089-918d-99875bb5d615	d4fc8665-afbb-44a1-badc-9a6d146bea95	2	10	f	\N	\N
941eeb3c-5ac5-4118-8380-363a453e49df	\N	client-jwt	39799f2c-4662-4089-918d-99875bb5d615	d4fc8665-afbb-44a1-badc-9a6d146bea95	2	20	f	\N	\N
76a3a8ca-2ea7-4444-8dea-3483f82f3d4f	\N	client-secret-jwt	39799f2c-4662-4089-918d-99875bb5d615	d4fc8665-afbb-44a1-badc-9a6d146bea95	2	30	f	\N	\N
aa47780c-fe06-45ed-ae66-95fd574b20a5	\N	client-x509	39799f2c-4662-4089-918d-99875bb5d615	d4fc8665-afbb-44a1-badc-9a6d146bea95	2	40	f	\N	\N
f3790a39-6ebf-463d-b0a8-7dda6bada4d7	\N	idp-review-profile	39799f2c-4662-4089-918d-99875bb5d615	6229ca01-23fd-4e46-8485-0ec1b837d175	0	10	f	\N	7b7e2119-79fd-4fe6-a68c-3548fafaf350
143cdcab-3b3a-47e3-9bc8-ae6dbd6a3412	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	6229ca01-23fd-4e46-8485-0ec1b837d175	0	20	t	c74b955f-faae-4ca7-b26b-f19e0dcc927c	\N
7476bb8b-e029-4618-980b-73c9900f5345	\N	idp-create-user-if-unique	39799f2c-4662-4089-918d-99875bb5d615	c74b955f-faae-4ca7-b26b-f19e0dcc927c	2	10	f	\N	d43189c5-c970-4b15-af28-300154b64945
7d582390-337a-42d2-8c42-7272a478404d	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	c74b955f-faae-4ca7-b26b-f19e0dcc927c	2	20	t	06998740-a053-4f33-b15e-008fc38ba8d1	\N
1167bc4c-65b3-478e-b1a3-5caaec6e8f6b	\N	idp-confirm-link	39799f2c-4662-4089-918d-99875bb5d615	06998740-a053-4f33-b15e-008fc38ba8d1	0	10	f	\N	\N
53dec2be-98de-4129-9bb3-1443a9eefb21	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	06998740-a053-4f33-b15e-008fc38ba8d1	0	20	t	34a16228-4fc9-4cfb-9f1f-0858b8370e3d	\N
93df2e06-52dc-40b0-af43-b0a108c19917	\N	idp-email-verification	39799f2c-4662-4089-918d-99875bb5d615	34a16228-4fc9-4cfb-9f1f-0858b8370e3d	2	10	f	\N	\N
c9be3ba9-cec2-47ab-95fd-5b24c015b996	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	34a16228-4fc9-4cfb-9f1f-0858b8370e3d	2	20	t	a622924b-6280-4818-b5a5-02a245ea39f1	\N
bd49e7a0-630f-4ce8-bc0d-46bc012d12ff	\N	idp-username-password-form	39799f2c-4662-4089-918d-99875bb5d615	a622924b-6280-4818-b5a5-02a245ea39f1	0	10	f	\N	\N
55c1d71d-244a-4ca7-b8cc-917b50e262b2	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	a622924b-6280-4818-b5a5-02a245ea39f1	1	20	t	803aa478-7c18-4c32-9e83-7048625eb135	\N
fe6d3275-7be5-4ec8-b8d1-f3c2406741ba	\N	conditional-user-configured	39799f2c-4662-4089-918d-99875bb5d615	803aa478-7c18-4c32-9e83-7048625eb135	0	10	f	\N	\N
84419244-8d2a-4ec7-a280-582c1b6cca32	\N	auth-otp-form	39799f2c-4662-4089-918d-99875bb5d615	803aa478-7c18-4c32-9e83-7048625eb135	0	20	f	\N	\N
e60d8584-c5aa-4716-811e-2c0cde43c214	\N	http-basic-authenticator	39799f2c-4662-4089-918d-99875bb5d615	1ebc9609-7e2b-4f12-8e62-cf0a7df1b1aa	0	10	f	\N	\N
3f1176f8-63b5-48b0-931a-89f08427f99f	\N	docker-http-basic-authenticator	39799f2c-4662-4089-918d-99875bb5d615	71c80d17-82cc-4f72-9c4a-a96f7dd52e56	0	10	f	\N	\N
\.


--
-- Data for Name: authentication_flow; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authentication_flow (id, alias, description, realm_id, provider_id, top_level, built_in) FROM stdin;
7fe234ba-d9e7-4b41-9511-45331ff663d1	browser	browser based authentication	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
56c7b820-b3ed-4786-acc4-95b3daa0b126	forms	Username, password, otp and other auth forms.	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
78ec2511-d2b8-4ca5-9d1b-492b5ddb29ab	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
9826ac06-9181-4a8e-9cc9-803a5bcb24e1	direct grant	OpenID Connect Resource Owner Grant	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
3cc21b7c-f7ea-4c14-b330-37a1263de288	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
86418ba0-1724-4c71-bb4e-552ee9d261b4	registration	registration flow	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
ceaf2317-fa56-4892-bec1-de797c80e9a7	registration form	registration form	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	form-flow	f	t
62cdea4e-8f0e-40a0-83f3-4bb8b86385ba	reset credentials	Reset credentials for a user if they forgot their password or something	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
8f63af60-2d0f-4304-b315-420067c28dc5	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
97f4ef24-5c21-4d64-8463-5cb4422548cd	clients	Base authentication for clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	client-flow	t	t
cd74b1af-5d26-4190-b42e-bc738bd58306	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
48f9438b-39a4-4697-82e0-371ea6252e89	User creation or linking	Flow for the existing/non-existing user alternatives	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
58a0b1ec-f7e1-4736-a4a1-3bf28fd65925	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
55569894-9383-4bb9-b447-700c9eee6006	Account verification options	Method with which to verity the existing account	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
d0f63671-f36d-47b3-8b09-3831a0cda36b	Verify Existing Account by Re-authentication	Reauthentication of existing account	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
beb2afd5-70df-4a0b-8c9c-2560719952fd	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	f	t
e207eb7d-4f47-4003-9f76-4a02450a321d	saml ecp	SAML ECP Profile Authentication Flow	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
66d74419-fb33-4573-a12f-59e460338ceb	docker auth	Used by Docker clients to authenticate against the IDP	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	basic-flow	t	t
90ebf45b-3c5c-4469-8625-859215281b41	browser	browser based authentication	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
2101400c-52de-49bf-96ef-de594e68ba97	forms	Username, password, otp and other auth forms.	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
41b8705c-76e5-4387-ab6f-857f478aa558	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
28251dec-7cd3-4e9c-a986-d9a83c93a9ac	direct grant	OpenID Connect Resource Owner Grant	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
e8c6d5e4-942a-4233-a0d6-b35cceb312d6	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
131d9af7-e015-4dfa-a39c-89a3b7870e9c	registration	registration flow	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
0a0dc57e-b08d-4c09-9fa0-443a59f990f3	registration form	registration form	39799f2c-4662-4089-918d-99875bb5d615	form-flow	f	t
47730fd5-8d4a-4cdc-87a5-d5e5d9f4c03e	reset credentials	Reset credentials for a user if they forgot their password or something	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
17c1e16a-d0a1-4688-8556-2b169a016463	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
d4fc8665-afbb-44a1-badc-9a6d146bea95	clients	Base authentication for clients	39799f2c-4662-4089-918d-99875bb5d615	client-flow	t	t
6229ca01-23fd-4e46-8485-0ec1b837d175	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
c74b955f-faae-4ca7-b26b-f19e0dcc927c	User creation or linking	Flow for the existing/non-existing user alternatives	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
06998740-a053-4f33-b15e-008fc38ba8d1	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
34a16228-4fc9-4cfb-9f1f-0858b8370e3d	Account verification options	Method with which to verity the existing account	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
a622924b-6280-4818-b5a5-02a245ea39f1	Verify Existing Account by Re-authentication	Reauthentication of existing account	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
803aa478-7c18-4c32-9e83-7048625eb135	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	f	t
1ebc9609-7e2b-4f12-8e62-cf0a7df1b1aa	saml ecp	SAML ECP Profile Authentication Flow	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
71c80d17-82cc-4f72-9c4a-a96f7dd52e56	docker auth	Used by Docker clients to authenticate against the IDP	39799f2c-4662-4089-918d-99875bb5d615	basic-flow	t	t
\.


--
-- Data for Name: authenticator_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authenticator_config (id, alias, realm_id) FROM stdin;
755975a0-c04e-4600-8203-76392022c56c	review profile config	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495
e3414a4a-a3a0-4afb-93ca-11f48fba7fc5	create unique user config	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495
7b7e2119-79fd-4fe6-a68c-3548fafaf350	review profile config	39799f2c-4662-4089-918d-99875bb5d615
d43189c5-c970-4b15-af28-300154b64945	create unique user config	39799f2c-4662-4089-918d-99875bb5d615
\.


--
-- Data for Name: authenticator_config_entry; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authenticator_config_entry (authenticator_id, value, name) FROM stdin;
755975a0-c04e-4600-8203-76392022c56c	missing	update.profile.on.first.login
e3414a4a-a3a0-4afb-93ca-11f48fba7fc5	false	require.password.update.after.registration
7b7e2119-79fd-4fe6-a68c-3548fafaf350	missing	update.profile.on.first.login
d43189c5-c970-4b15-af28-300154b64945	false	require.password.update.after.registration
\.


--
-- Data for Name: broker_link; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.broker_link (identity_provider, storage_provider_id, realm_id, broker_user_id, broker_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client (id, enabled, full_scope_allowed, client_id, not_before, public_client, secret, base_url, bearer_only, management_url, surrogate_auth_required, realm_id, protocol, node_rereg_timeout, frontchannel_logout, consent_required, name, service_accounts_enabled, client_authenticator_type, root_url, description, registration_token, standard_flow_enabled, implicit_flow_enabled, direct_access_grants_enabled, always_display_in_console) FROM stdin;
e952156e-f82e-4d72-bc50-8814ff85661f	t	f	master-realm	0	f	\N	\N	t	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	0	f	f	master Realm	f	client-secret	\N	\N	\N	t	f	f	f
e047e211-4b1f-48d9-8e30-1cd8ff641961	t	f	account	0	t	\N	/realms/master/account/	f	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
7ea80c92-3515-4b04-aff9-7f1705afa3ed	t	f	account-console	0	t	\N	/realms/master/account/	f	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	t	f	broker	0	f	\N	\N	t	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	t	f	security-admin-console	0	t	\N	/admin/master/console/	f	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
d17a450b-a5a4-47a4-a162-4d1441f2880b	t	f	admin-cli	0	t	\N	\N	f	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	f	ClinicRealm-realm	0	f	\N	\N	t	\N	f	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	0	f	f	ClinicRealm Realm	f	client-secret	\N	\N	\N	t	f	f	f
7673150c-c2f3-4b70-b36a-109bb4924d43	t	f	realm-management	0	f	\N	\N	t	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	0	f	f	${client_realm-management}	f	client-secret	\N	\N	\N	t	f	f	f
b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	f	account	0	t	\N	/realms/ClinicRealm/account/	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
ce36e3cf-12d4-45c1-a954-af3e053acec8	t	f	account-console	0	t	\N	/realms/ClinicRealm/account/	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
2bc20571-4afb-434b-b71b-0c2394ef0970	t	f	broker	0	f	\N	\N	t	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	t	f	security-admin-console	0	t	\N	/admin/ClinicRealm/console/	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	t	t	web-ui	0	t	\N	\N	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	-1	f	f	Web UI	f	client-secret	\N	\N	\N	t	t	t	f
12ee7e32-a154-4be9-ab5c-6f437c15ce71	t	t	patient-portal	0	t	\N	\N	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	-1	f	f	Patient Portal	f	client-secret	\N	\N	\N	t	t	t	f
45324d7c-9871-48eb-933d-f85d78844baf	t	t	siem-dashboard	0	t	\N	\N	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	-1	f	f	SIEM Dashboard	f	client-secret	\N	\N	\N	t	t	t	f
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	t	t	openemr-oidc	0	f	ku6sHO8C12AiCoAn6sz1csS40m3tvFV0	\N	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	-1	f	f	OpenEMR OIDC	f	client-secret	\N	\N	\N	t	f	f	f
0359f14d-528f-4db8-8c22-5bd76f88ef0c	t	t	admin-cli	0	f	admin-cli-secret-key-12345	\N	f	\N	f	39799f2c-4662-4089-918d-99875bb5d615	openid-connect	-1	f	f	Admin CLI	f	client-secret	\N	\N	\N	f	f	t	f
\.


--
-- Data for Name: client_attributes; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_attributes (client_id, name, value) FROM stdin;
e047e211-4b1f-48d9-8e30-1cd8ff641961	post.logout.redirect.uris	+
7ea80c92-3515-4b04-aff9-7f1705afa3ed	post.logout.redirect.uris	+
7ea80c92-3515-4b04-aff9-7f1705afa3ed	pkce.code.challenge.method	S256
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	post.logout.redirect.uris	+
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	pkce.code.challenge.method	S256
b71e9c14-021e-4da0-a568-30dd6a6c7e58	post.logout.redirect.uris	+
ce36e3cf-12d4-45c1-a954-af3e053acec8	post.logout.redirect.uris	+
ce36e3cf-12d4-45c1-a954-af3e053acec8	pkce.code.challenge.method	S256
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	post.logout.redirect.uris	+
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	pkce.code.challenge.method	S256
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	post.logout.redirect.uris	+
12ee7e32-a154-4be9-ab5c-6f437c15ce71	post.logout.redirect.uris	+
45324d7c-9871-48eb-933d-f85d78844baf	post.logout.redirect.uris	+
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	post.logout.redirect.uris	+
0359f14d-528f-4db8-8c22-5bd76f88ef0c	post.logout.redirect.uris	+
\.


--
-- Data for Name: client_auth_flow_bindings; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_auth_flow_bindings (client_id, flow_id, binding_name) FROM stdin;
\.


--
-- Data for Name: client_initial_access; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_initial_access (id, realm_id, "timestamp", expiration, count, remaining_count) FROM stdin;
\.


--
-- Data for Name: client_node_registrations; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_node_registrations (client_id, value, name) FROM stdin;
\.


--
-- Data for Name: client_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope (id, name, realm_id, description, protocol) FROM stdin;
3b223e82-9319-4436-a3ac-b4df4c3382b0	offline_access	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect built-in scope: offline_access	openid-connect
3fc2a2c7-8e2d-43d3-86e5-a954797c1069	role_list	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	SAML role list	saml
a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	profile	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect built-in scope: profile	openid-connect
bab05a29-9c5c-4e69-9413-0fddb2ebe402	email	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect built-in scope: email	openid-connect
3d4f589c-f733-4181-9900-f8061e8fd29c	address	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect built-in scope: address	openid-connect
6ce76ede-d612-4715-93a6-179246514501	phone	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect built-in scope: phone	openid-connect
89829ff3-f089-4c29-a729-b750ba3d3138	roles	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect scope for add user roles to the access token	openid-connect
7980e866-3958-4e29-a615-6595735efaec	web-origins	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect scope for add allowed web origins to the access token	openid-connect
853bf943-afd8-4571-9892-abca3a489513	microprofile-jwt	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	Microprofile - JWT built-in scope	openid-connect
e6407edd-4d85-4bd0-8e87-2b82f68b06cf	acr	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
03c28e19-3bea-4089-8ea6-d1e07cb2b245	offline_access	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect built-in scope: offline_access	openid-connect
66d84b40-237a-478e-b178-1b87cd943a14	role_list	39799f2c-4662-4089-918d-99875bb5d615	SAML role list	saml
973c248d-715b-444f-8235-efec1a8ca602	profile	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect built-in scope: profile	openid-connect
ffab2650-2172-4056-84d7-e5e4db9ba524	email	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect built-in scope: email	openid-connect
fb732bce-d898-4f3e-994c-f7641047accd	address	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect built-in scope: address	openid-connect
42ce5674-7218-4105-b076-68ffdba861c2	phone	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect built-in scope: phone	openid-connect
91617ee0-425c-4a3b-9794-44953bf73618	roles	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect scope for add user roles to the access token	openid-connect
7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	web-origins	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect scope for add allowed web origins to the access token	openid-connect
48526f32-1519-4fea-a921-dcc083551af2	microprofile-jwt	39799f2c-4662-4089-918d-99875bb5d615	Microprofile - JWT built-in scope	openid-connect
23e798cb-f10c-44a4-a465-473f300db2b7	acr	39799f2c-4662-4089-918d-99875bb5d615	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
\.


--
-- Data for Name: client_scope_attributes; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope_attributes (scope_id, value, name) FROM stdin;
3b223e82-9319-4436-a3ac-b4df4c3382b0	true	display.on.consent.screen
3b223e82-9319-4436-a3ac-b4df4c3382b0	${offlineAccessScopeConsentText}	consent.screen.text
3fc2a2c7-8e2d-43d3-86e5-a954797c1069	true	display.on.consent.screen
3fc2a2c7-8e2d-43d3-86e5-a954797c1069	${samlRoleListScopeConsentText}	consent.screen.text
a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	true	display.on.consent.screen
a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	${profileScopeConsentText}	consent.screen.text
a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	true	include.in.token.scope
bab05a29-9c5c-4e69-9413-0fddb2ebe402	true	display.on.consent.screen
bab05a29-9c5c-4e69-9413-0fddb2ebe402	${emailScopeConsentText}	consent.screen.text
bab05a29-9c5c-4e69-9413-0fddb2ebe402	true	include.in.token.scope
3d4f589c-f733-4181-9900-f8061e8fd29c	true	display.on.consent.screen
3d4f589c-f733-4181-9900-f8061e8fd29c	${addressScopeConsentText}	consent.screen.text
3d4f589c-f733-4181-9900-f8061e8fd29c	true	include.in.token.scope
6ce76ede-d612-4715-93a6-179246514501	true	display.on.consent.screen
6ce76ede-d612-4715-93a6-179246514501	${phoneScopeConsentText}	consent.screen.text
6ce76ede-d612-4715-93a6-179246514501	true	include.in.token.scope
89829ff3-f089-4c29-a729-b750ba3d3138	true	display.on.consent.screen
89829ff3-f089-4c29-a729-b750ba3d3138	${rolesScopeConsentText}	consent.screen.text
89829ff3-f089-4c29-a729-b750ba3d3138	false	include.in.token.scope
7980e866-3958-4e29-a615-6595735efaec	false	display.on.consent.screen
7980e866-3958-4e29-a615-6595735efaec		consent.screen.text
7980e866-3958-4e29-a615-6595735efaec	false	include.in.token.scope
853bf943-afd8-4571-9892-abca3a489513	false	display.on.consent.screen
853bf943-afd8-4571-9892-abca3a489513	true	include.in.token.scope
e6407edd-4d85-4bd0-8e87-2b82f68b06cf	false	display.on.consent.screen
e6407edd-4d85-4bd0-8e87-2b82f68b06cf	false	include.in.token.scope
03c28e19-3bea-4089-8ea6-d1e07cb2b245	true	display.on.consent.screen
03c28e19-3bea-4089-8ea6-d1e07cb2b245	${offlineAccessScopeConsentText}	consent.screen.text
66d84b40-237a-478e-b178-1b87cd943a14	true	display.on.consent.screen
66d84b40-237a-478e-b178-1b87cd943a14	${samlRoleListScopeConsentText}	consent.screen.text
973c248d-715b-444f-8235-efec1a8ca602	true	display.on.consent.screen
973c248d-715b-444f-8235-efec1a8ca602	${profileScopeConsentText}	consent.screen.text
973c248d-715b-444f-8235-efec1a8ca602	true	include.in.token.scope
ffab2650-2172-4056-84d7-e5e4db9ba524	true	display.on.consent.screen
ffab2650-2172-4056-84d7-e5e4db9ba524	${emailScopeConsentText}	consent.screen.text
ffab2650-2172-4056-84d7-e5e4db9ba524	true	include.in.token.scope
fb732bce-d898-4f3e-994c-f7641047accd	true	display.on.consent.screen
fb732bce-d898-4f3e-994c-f7641047accd	${addressScopeConsentText}	consent.screen.text
fb732bce-d898-4f3e-994c-f7641047accd	true	include.in.token.scope
42ce5674-7218-4105-b076-68ffdba861c2	true	display.on.consent.screen
42ce5674-7218-4105-b076-68ffdba861c2	${phoneScopeConsentText}	consent.screen.text
42ce5674-7218-4105-b076-68ffdba861c2	true	include.in.token.scope
91617ee0-425c-4a3b-9794-44953bf73618	true	display.on.consent.screen
91617ee0-425c-4a3b-9794-44953bf73618	${rolesScopeConsentText}	consent.screen.text
91617ee0-425c-4a3b-9794-44953bf73618	false	include.in.token.scope
7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	false	display.on.consent.screen
7d9a70a7-78b3-4d4e-bcda-db69b36d64ba		consent.screen.text
7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	false	include.in.token.scope
48526f32-1519-4fea-a921-dcc083551af2	false	display.on.consent.screen
48526f32-1519-4fea-a921-dcc083551af2	true	include.in.token.scope
23e798cb-f10c-44a4-a465-473f300db2b7	false	display.on.consent.screen
23e798cb-f10c-44a4-a465-473f300db2b7	false	include.in.token.scope
\.


--
-- Data for Name: client_scope_client; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope_client (client_id, scope_id, default_scope) FROM stdin;
e047e211-4b1f-48d9-8e30-1cd8ff641961	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
e047e211-4b1f-48d9-8e30-1cd8ff641961	89829ff3-f089-4c29-a729-b750ba3d3138	t
e047e211-4b1f-48d9-8e30-1cd8ff641961	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
e047e211-4b1f-48d9-8e30-1cd8ff641961	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
e047e211-4b1f-48d9-8e30-1cd8ff641961	7980e866-3958-4e29-a615-6595735efaec	t
e047e211-4b1f-48d9-8e30-1cd8ff641961	3d4f589c-f733-4181-9900-f8061e8fd29c	f
e047e211-4b1f-48d9-8e30-1cd8ff641961	6ce76ede-d612-4715-93a6-179246514501	f
e047e211-4b1f-48d9-8e30-1cd8ff641961	853bf943-afd8-4571-9892-abca3a489513	f
e047e211-4b1f-48d9-8e30-1cd8ff641961	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
7ea80c92-3515-4b04-aff9-7f1705afa3ed	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
7ea80c92-3515-4b04-aff9-7f1705afa3ed	89829ff3-f089-4c29-a729-b750ba3d3138	t
7ea80c92-3515-4b04-aff9-7f1705afa3ed	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
7ea80c92-3515-4b04-aff9-7f1705afa3ed	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
7ea80c92-3515-4b04-aff9-7f1705afa3ed	7980e866-3958-4e29-a615-6595735efaec	t
7ea80c92-3515-4b04-aff9-7f1705afa3ed	3d4f589c-f733-4181-9900-f8061e8fd29c	f
7ea80c92-3515-4b04-aff9-7f1705afa3ed	6ce76ede-d612-4715-93a6-179246514501	f
7ea80c92-3515-4b04-aff9-7f1705afa3ed	853bf943-afd8-4571-9892-abca3a489513	f
7ea80c92-3515-4b04-aff9-7f1705afa3ed	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
d17a450b-a5a4-47a4-a162-4d1441f2880b	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
d17a450b-a5a4-47a4-a162-4d1441f2880b	89829ff3-f089-4c29-a729-b750ba3d3138	t
d17a450b-a5a4-47a4-a162-4d1441f2880b	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
d17a450b-a5a4-47a4-a162-4d1441f2880b	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
d17a450b-a5a4-47a4-a162-4d1441f2880b	7980e866-3958-4e29-a615-6595735efaec	t
d17a450b-a5a4-47a4-a162-4d1441f2880b	3d4f589c-f733-4181-9900-f8061e8fd29c	f
d17a450b-a5a4-47a4-a162-4d1441f2880b	6ce76ede-d612-4715-93a6-179246514501	f
d17a450b-a5a4-47a4-a162-4d1441f2880b	853bf943-afd8-4571-9892-abca3a489513	f
d17a450b-a5a4-47a4-a162-4d1441f2880b	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	89829ff3-f089-4c29-a729-b750ba3d3138	t
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	7980e866-3958-4e29-a615-6595735efaec	t
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	3d4f589c-f733-4181-9900-f8061e8fd29c	f
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	6ce76ede-d612-4715-93a6-179246514501	f
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	853bf943-afd8-4571-9892-abca3a489513	f
622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
e952156e-f82e-4d72-bc50-8814ff85661f	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
e952156e-f82e-4d72-bc50-8814ff85661f	89829ff3-f089-4c29-a729-b750ba3d3138	t
e952156e-f82e-4d72-bc50-8814ff85661f	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
e952156e-f82e-4d72-bc50-8814ff85661f	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
e952156e-f82e-4d72-bc50-8814ff85661f	7980e866-3958-4e29-a615-6595735efaec	t
e952156e-f82e-4d72-bc50-8814ff85661f	3d4f589c-f733-4181-9900-f8061e8fd29c	f
e952156e-f82e-4d72-bc50-8814ff85661f	6ce76ede-d612-4715-93a6-179246514501	f
e952156e-f82e-4d72-bc50-8814ff85661f	853bf943-afd8-4571-9892-abca3a489513	f
e952156e-f82e-4d72-bc50-8814ff85661f	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	89829ff3-f089-4c29-a729-b750ba3d3138	t
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	7980e866-3958-4e29-a615-6595735efaec	t
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	3d4f589c-f733-4181-9900-f8061e8fd29c	f
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	6ce76ede-d612-4715-93a6-179246514501	f
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	853bf943-afd8-4571-9892-abca3a489513	f
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
b71e9c14-021e-4da0-a568-30dd6a6c7e58	23e798cb-f10c-44a4-a465-473f300db2b7	t
b71e9c14-021e-4da0-a568-30dd6a6c7e58	973c248d-715b-444f-8235-efec1a8ca602	t
b71e9c14-021e-4da0-a568-30dd6a6c7e58	ffab2650-2172-4056-84d7-e5e4db9ba524	t
b71e9c14-021e-4da0-a568-30dd6a6c7e58	91617ee0-425c-4a3b-9794-44953bf73618	t
b71e9c14-021e-4da0-a568-30dd6a6c7e58	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
b71e9c14-021e-4da0-a568-30dd6a6c7e58	42ce5674-7218-4105-b076-68ffdba861c2	f
b71e9c14-021e-4da0-a568-30dd6a6c7e58	fb732bce-d898-4f3e-994c-f7641047accd	f
b71e9c14-021e-4da0-a568-30dd6a6c7e58	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
b71e9c14-021e-4da0-a568-30dd6a6c7e58	48526f32-1519-4fea-a921-dcc083551af2	f
ce36e3cf-12d4-45c1-a954-af3e053acec8	23e798cb-f10c-44a4-a465-473f300db2b7	t
ce36e3cf-12d4-45c1-a954-af3e053acec8	973c248d-715b-444f-8235-efec1a8ca602	t
ce36e3cf-12d4-45c1-a954-af3e053acec8	ffab2650-2172-4056-84d7-e5e4db9ba524	t
ce36e3cf-12d4-45c1-a954-af3e053acec8	91617ee0-425c-4a3b-9794-44953bf73618	t
ce36e3cf-12d4-45c1-a954-af3e053acec8	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
ce36e3cf-12d4-45c1-a954-af3e053acec8	42ce5674-7218-4105-b076-68ffdba861c2	f
ce36e3cf-12d4-45c1-a954-af3e053acec8	fb732bce-d898-4f3e-994c-f7641047accd	f
ce36e3cf-12d4-45c1-a954-af3e053acec8	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
ce36e3cf-12d4-45c1-a954-af3e053acec8	48526f32-1519-4fea-a921-dcc083551af2	f
2bc20571-4afb-434b-b71b-0c2394ef0970	23e798cb-f10c-44a4-a465-473f300db2b7	t
2bc20571-4afb-434b-b71b-0c2394ef0970	973c248d-715b-444f-8235-efec1a8ca602	t
2bc20571-4afb-434b-b71b-0c2394ef0970	ffab2650-2172-4056-84d7-e5e4db9ba524	t
2bc20571-4afb-434b-b71b-0c2394ef0970	91617ee0-425c-4a3b-9794-44953bf73618	t
2bc20571-4afb-434b-b71b-0c2394ef0970	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
2bc20571-4afb-434b-b71b-0c2394ef0970	42ce5674-7218-4105-b076-68ffdba861c2	f
2bc20571-4afb-434b-b71b-0c2394ef0970	fb732bce-d898-4f3e-994c-f7641047accd	f
2bc20571-4afb-434b-b71b-0c2394ef0970	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
2bc20571-4afb-434b-b71b-0c2394ef0970	48526f32-1519-4fea-a921-dcc083551af2	f
7673150c-c2f3-4b70-b36a-109bb4924d43	23e798cb-f10c-44a4-a465-473f300db2b7	t
7673150c-c2f3-4b70-b36a-109bb4924d43	973c248d-715b-444f-8235-efec1a8ca602	t
7673150c-c2f3-4b70-b36a-109bb4924d43	ffab2650-2172-4056-84d7-e5e4db9ba524	t
7673150c-c2f3-4b70-b36a-109bb4924d43	91617ee0-425c-4a3b-9794-44953bf73618	t
7673150c-c2f3-4b70-b36a-109bb4924d43	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
7673150c-c2f3-4b70-b36a-109bb4924d43	42ce5674-7218-4105-b076-68ffdba861c2	f
7673150c-c2f3-4b70-b36a-109bb4924d43	fb732bce-d898-4f3e-994c-f7641047accd	f
7673150c-c2f3-4b70-b36a-109bb4924d43	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
7673150c-c2f3-4b70-b36a-109bb4924d43	48526f32-1519-4fea-a921-dcc083551af2	f
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	23e798cb-f10c-44a4-a465-473f300db2b7	t
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	973c248d-715b-444f-8235-efec1a8ca602	t
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	ffab2650-2172-4056-84d7-e5e4db9ba524	t
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	91617ee0-425c-4a3b-9794-44953bf73618	t
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	42ce5674-7218-4105-b076-68ffdba861c2	f
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	fb732bce-d898-4f3e-994c-f7641047accd	f
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	48526f32-1519-4fea-a921-dcc083551af2	f
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	91617ee0-425c-4a3b-9794-44953bf73618	t
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	973c248d-715b-444f-8235-efec1a8ca602	t
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	ffab2650-2172-4056-84d7-e5e4db9ba524	t
12ee7e32-a154-4be9-ab5c-6f437c15ce71	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
12ee7e32-a154-4be9-ab5c-6f437c15ce71	91617ee0-425c-4a3b-9794-44953bf73618	t
12ee7e32-a154-4be9-ab5c-6f437c15ce71	973c248d-715b-444f-8235-efec1a8ca602	t
12ee7e32-a154-4be9-ab5c-6f437c15ce71	ffab2650-2172-4056-84d7-e5e4db9ba524	t
45324d7c-9871-48eb-933d-f85d78844baf	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
45324d7c-9871-48eb-933d-f85d78844baf	91617ee0-425c-4a3b-9794-44953bf73618	t
45324d7c-9871-48eb-933d-f85d78844baf	973c248d-715b-444f-8235-efec1a8ca602	t
45324d7c-9871-48eb-933d-f85d78844baf	ffab2650-2172-4056-84d7-e5e4db9ba524	t
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	91617ee0-425c-4a3b-9794-44953bf73618	t
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	973c248d-715b-444f-8235-efec1a8ca602	t
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	ffab2650-2172-4056-84d7-e5e4db9ba524	t
0359f14d-528f-4db8-8c22-5bd76f88ef0c	23e798cb-f10c-44a4-a465-473f300db2b7	t
0359f14d-528f-4db8-8c22-5bd76f88ef0c	973c248d-715b-444f-8235-efec1a8ca602	t
0359f14d-528f-4db8-8c22-5bd76f88ef0c	ffab2650-2172-4056-84d7-e5e4db9ba524	t
0359f14d-528f-4db8-8c22-5bd76f88ef0c	91617ee0-425c-4a3b-9794-44953bf73618	t
0359f14d-528f-4db8-8c22-5bd76f88ef0c	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
0359f14d-528f-4db8-8c22-5bd76f88ef0c	42ce5674-7218-4105-b076-68ffdba861c2	f
0359f14d-528f-4db8-8c22-5bd76f88ef0c	fb732bce-d898-4f3e-994c-f7641047accd	f
0359f14d-528f-4db8-8c22-5bd76f88ef0c	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
0359f14d-528f-4db8-8c22-5bd76f88ef0c	48526f32-1519-4fea-a921-dcc083551af2	f
\.


--
-- Data for Name: client_scope_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope_role_mapping (scope_id, role_id) FROM stdin;
3b223e82-9319-4436-a3ac-b4df4c3382b0	cbc07a72-3b18-438b-a3db-4c090db6fb92
03c28e19-3bea-4089-8ea6-d1e07cb2b245	85dafa71-06ae-4608-83b1-23989ec24c8b
\.


--
-- Data for Name: client_session; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_session (id, client_id, redirect_uri, state, "timestamp", session_id, auth_method, realm_id, auth_user_id, current_action) FROM stdin;
\.


--
-- Data for Name: client_session_auth_status; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_session_auth_status (authenticator, status, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_note; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_session_note (name, value, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_prot_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_session_prot_mapper (protocol_mapper_id, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_role; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_session_role (role_id, client_session) FROM stdin;
\.


--
-- Data for Name: client_user_session_note; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_user_session_note (name, value, client_session) FROM stdin;
\.


--
-- Data for Name: component; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.component (id, name, parent_id, provider_id, provider_type, realm_id, sub_type) FROM stdin;
d304095a-afab-4dec-b7df-a98951cb300e	Trusted Hosts	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	anonymous
08d079aa-8b88-43c7-aaee-a612bc4820ec	Consent Required	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	anonymous
e11d7af4-4f59-41eb-af21-d97c697a14cf	Full Scope Disabled	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	anonymous
69453783-e1cc-4357-8b9c-8f270489c535	Max Clients Limit	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	anonymous
4d2027e9-ca11-4395-af8e-b8be072d0c91	Allowed Protocol Mapper Types	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	anonymous
b53a3d60-0c0f-494e-afbe-57ab818262da	Allowed Client Scopes	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	anonymous
c95f18f9-72e6-4e05-bd9d-3098c44fd518	Allowed Protocol Mapper Types	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	authenticated
143f4fa5-b939-4ae3-bf47-0037d4d2e855	Allowed Client Scopes	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	authenticated
15de0709-9a39-4772-b4d5-2e5bfaf7fc5f	rsa-generated	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	rsa-generated	org.keycloak.keys.KeyProvider	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N
d89dd713-4d07-433c-9998-a3929f042e37	rsa-enc-generated	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	rsa-enc-generated	org.keycloak.keys.KeyProvider	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N
a0ba5edf-9dc1-43ef-84c6-d7536ff84ecb	hmac-generated	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	hmac-generated	org.keycloak.keys.KeyProvider	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N
696909d4-eb2c-4778-9bbb-807662fbb3fc	aes-generated	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	aes-generated	org.keycloak.keys.KeyProvider	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N
6f8377ed-8488-40f6-b3ba-51db4936ee73	rsa-generated	39799f2c-4662-4089-918d-99875bb5d615	rsa-generated	org.keycloak.keys.KeyProvider	39799f2c-4662-4089-918d-99875bb5d615	\N
95fa2abd-845d-47fe-986f-16176365e7c4	rsa-enc-generated	39799f2c-4662-4089-918d-99875bb5d615	rsa-enc-generated	org.keycloak.keys.KeyProvider	39799f2c-4662-4089-918d-99875bb5d615	\N
86a0f33c-e705-4918-b4c4-f15f763d60c7	hmac-generated	39799f2c-4662-4089-918d-99875bb5d615	hmac-generated	org.keycloak.keys.KeyProvider	39799f2c-4662-4089-918d-99875bb5d615	\N
82cf6d8a-4efb-4e71-9263-1fe467236855	aes-generated	39799f2c-4662-4089-918d-99875bb5d615	aes-generated	org.keycloak.keys.KeyProvider	39799f2c-4662-4089-918d-99875bb5d615	\N
5a0a9bed-8190-4c6e-aa90-bf8f75356bb9	Trusted Hosts	39799f2c-4662-4089-918d-99875bb5d615	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	anonymous
5e12db7e-2f41-485d-aef8-32cc47aa52bf	Consent Required	39799f2c-4662-4089-918d-99875bb5d615	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	anonymous
320f2d1d-5796-4d7e-bffa-0e97cf0ad03d	Full Scope Disabled	39799f2c-4662-4089-918d-99875bb5d615	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	anonymous
0c87388d-7d9b-4cd8-b2bb-0cd53a2f8285	Max Clients Limit	39799f2c-4662-4089-918d-99875bb5d615	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	anonymous
9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	Allowed Protocol Mapper Types	39799f2c-4662-4089-918d-99875bb5d615	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	anonymous
48ef0947-2fc4-4924-82b8-cc5ed9af9504	Allowed Client Scopes	39799f2c-4662-4089-918d-99875bb5d615	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	anonymous
aaa71db2-7553-4744-ba46-5139415f2317	Allowed Protocol Mapper Types	39799f2c-4662-4089-918d-99875bb5d615	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	authenticated
5955d06f-3ebe-496c-ab6e-2bed23915124	Allowed Client Scopes	39799f2c-4662-4089-918d-99875bb5d615	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	39799f2c-4662-4089-918d-99875bb5d615	authenticated
\.


--
-- Data for Name: component_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.component_config (id, component_id, name, value) FROM stdin;
57612d05-f36a-4ce4-8107-c24e9d39c1ea	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
37da9292-93a1-4452-a657-4e0222f90b37	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	saml-user-property-mapper
864f0c04-b06a-4e52-bc00-4ec0e3dcbc25	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	oidc-full-name-mapper
5600ceb2-ac02-4ac8-b4e2-fc64de32fa95	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	saml-user-attribute-mapper
8c3de37b-ffec-4d49-a7fa-e193f2559636	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	saml-role-list-mapper
7dac5319-74e7-4fd3-aaa9-296c5ec9d493	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
57c79608-804c-4a9b-a665-629dd2a9ed3c	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	oidc-address-mapper
4a3f06f4-3c00-4ee0-b8ac-92541eb7a4eb	4d2027e9-ca11-4395-af8e-b8be072d0c91	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
31ca075e-1048-4e44-87c8-9ef710d1fbf6	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
18ded906-de70-4912-8851-b21b7538ed94	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	oidc-address-mapper
eaff6cb3-9b55-4b41-88c6-27036803ce99	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
83a524cd-d20c-422c-bec8-129e564a5e44	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
c779394c-2649-433a-ac47-7964c59994ea	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	saml-user-property-mapper
dfeae7b0-9aba-4b89-9cc3-61887933d865	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	oidc-full-name-mapper
c46fe8e2-6e09-4c9e-9a1e-3ce46fa56f89	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	saml-user-attribute-mapper
d2e01395-bb4e-4265-8c4f-99955e20322c	c95f18f9-72e6-4e05-bd9d-3098c44fd518	allowed-protocol-mapper-types	saml-role-list-mapper
3ccd60fe-9f73-49d4-9bed-181df9721895	143f4fa5-b939-4ae3-bf47-0037d4d2e855	allow-default-scopes	true
2346e60d-f298-43f4-9d5c-800943e3da76	69453783-e1cc-4357-8b9c-8f270489c535	max-clients	200
6c1e4b67-b7f4-47a5-a6f3-69f9e04ec187	d304095a-afab-4dec-b7df-a98951cb300e	host-sending-registration-request-must-match	true
0ac546f8-545e-4786-a484-4a20e127fb6b	d304095a-afab-4dec-b7df-a98951cb300e	client-uris-must-match	true
b04ffa50-8fef-4b8a-8de0-5efaf49e0c85	b53a3d60-0c0f-494e-afbe-57ab818262da	allow-default-scopes	true
4c2ddc93-808b-4efa-b94a-f33a9ba6a68c	a0ba5edf-9dc1-43ef-84c6-d7536ff84ecb	priority	100
8a3a818e-e2bd-4443-9cfa-1365c96375df	a0ba5edf-9dc1-43ef-84c6-d7536ff84ecb	secret	pPkAiCkJh4MrfFBuSnmFzronimWnbp296t8dIKMmlx0u9l99CgyFVvZHn_TghQrZmNfx674Y-tS-fcOLIkh-ig
31724872-16ff-4428-b6a6-f083e4ae1b4a	a0ba5edf-9dc1-43ef-84c6-d7536ff84ecb	algorithm	HS256
1c911f7a-c4db-4c38-acf8-48b10625997b	a0ba5edf-9dc1-43ef-84c6-d7536ff84ecb	kid	1c368717-deb4-491e-a33b-f8b25b51449b
4628642d-50cb-4c08-bb3c-4a5099293bd9	696909d4-eb2c-4778-9bbb-807662fbb3fc	priority	100
fe91ecb6-4411-4d5f-b8bc-6dd7419e4815	696909d4-eb2c-4778-9bbb-807662fbb3fc	kid	5fccacad-47cd-483c-bc7b-1990defdbf28
d96b7c48-04cb-43c7-b0f3-3f9132fff39d	696909d4-eb2c-4778-9bbb-807662fbb3fc	secret	cT1O0no3T7OX-jHozxTBsg
c4c2bfc1-c4c0-4a92-9af6-9b9ca37b749d	15de0709-9a39-4772-b4d5-2e5bfaf7fc5f	keyUse	SIG
de90c3d0-6458-499f-a109-6b40a8cbabaa	15de0709-9a39-4772-b4d5-2e5bfaf7fc5f	certificate	MIICmzCCAYMCBgGaPD+9uzANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjUxMDMxMjE0ODIxWhcNMzUxMDMxMjE1MDAxWjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCNJiP67xwanJBA9QUuOTGnIjelNkxAodnQk1Ymco/2iZF5CtKQUr7+cbqJl8sWsmrlMEaeBeVEZOQXc61TuVJlH7U5A/4BqpJTVSOF70GmgHgGSgVIEgp+h7RC3J4+4lpobn9bwQMiXFmygQmIn2TCOkc/HYKzOaLbEUmxQ63v/Uv/8KgyUFtTmkbao+s5yUSO1+yCQCrPTfW6WNnKhQgCcagfFlOoUTL6KNaW5afn6u+DpbexNS870FgRZ9WdwphuOClBGUFFOGSfXEANDJUA6luEbqLHSHEBbopHmr2Z9K10X25D0KnQCWpzs0UWtqhSWCOL9mEza/WQGIIQ1esfAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAILReAfG0QNITTSuFC+oEBafrbC37HlE9JfZZbmK52HDOPhCx0wc4m9EnlFvHlUN/Ni+Y667SMggocFT4n7sqc78/uTHGPzcbSu1Yw+TQkOmWobHFUC7d+9meIDDHE+0IUNnRtEC3SfVcm21bNIz9rujcPYkg5PP9ADLrVKsIGEw3i/duf6GIy2rFFToxdMj3iRep39cIpbleXEWDf4r9ue8lK75+YBH3/5QsNeZXE9flAx3XoxXgWPli+VwMVFRCtNMoXMGcL6owCDlZh66pNlpBK7KFzPNOwuIPj4lV3+QZCc6MhcyfVnxEaLbAAzEF7Ul6M2+vzufhd524k4pcU8=
87a180d6-9fb9-4de1-8288-8291854237ed	15de0709-9a39-4772-b4d5-2e5bfaf7fc5f	privateKey	MIIEowIBAAKCAQEAjSYj+u8cGpyQQPUFLjkxpyI3pTZMQKHZ0JNWJnKP9omReQrSkFK+/nG6iZfLFrJq5TBGngXlRGTkF3OtU7lSZR+1OQP+AaqSU1Ujhe9BpoB4BkoFSBIKfoe0QtyePuJaaG5/W8EDIlxZsoEJiJ9kwjpHPx2Cszmi2xFJsUOt7/1L//CoMlBbU5pG2qPrOclEjtfsgkAqz031uljZyoUIAnGoHxZTqFEy+ijWluWn5+rvg6W3sTUvO9BYEWfVncKYbjgpQRlBRThkn1xADQyVAOpbhG6ix0hxAW6KR5q9mfStdF9uQ9Cp0Alqc7NFFraoUlgji/ZhM2v1kBiCENXrHwIDAQABAoIBACYSkyL1CzocYAa9cJPKxptj7emI72GBpryNeW/ud+mSquQg6LIYN79vUtcZVCT/pDjE4E9wnKppomK3B5otQ03Wky3ZZ1LwvP5wWSAf7K/qODXOEoWhpCYEGbntQ1wH90XzBDRuKBfFHEa7aqRpBicjzCL4pVANrGF11NBVRp4UaKM/Tds+f0YvXKtEyc56onJfKBUWEN+Wtd2QNJ8iG+HidBIAZIsALIS5XswvJFzcPQUM6kIRY3f/Mq3AyBaS4k0238UbQmKlTQWFI6NeJLqqrX4ZDk3R/uYKwXd2iaK5w/7FyzMPOV8Af4UMOyTZ+BbvKcx8g/YD8jeWHYMPtvECgYEAxYmw8LCWYlpERcKLHvcpqtD0j35Ubw+ALdk/kVu379inY5ajkgy4rjXTb8abN3G0IpD11JbPeWX8k6eKAWIyTrzK9a654UFxYSmI4O6k6nHWFCjdBsJVx7TUU3ODrnL319wLrZqtQeSgI6P8HnycSWdBEUQNYuVvFK0WS1fZr88CgYEAtuwwRyDPVTDSEFHZtu6dtFvnT22QBX629VN7OEuZnndr65C/LsePHMwRhLXVZ6ZOaE+CJGpvekfu6R46sBpbhpC/AGEZI5WEtOoIGNqA5FYaNOlJLkOxVM4nQE225jzbParHpmDpeRO8xTxgCI76vIPNloSrtSg+HXaSfHMJE7ECgYEApBrgeQRq2qhc4YteIkp5PiQ7l93+bQl2liBOVAbbRxE49l4V42ZYIroqvkhDeIsoeDLvVz42fIcCjvP3jXCzlH/5KKOQXpcMhwiHYz4+mVoa3EKaZFwcAT2zyuRDODDgv15aAU5nsz8o3pMEB5vEBqMWBi7/4/HxFz84Lz17ZjcCgYBkUDpZh2CsM02/rWNbspfBpPTA1jC5Erh66QEV6j+ga5U/Ze2yVbXh8Pdac+1IHie5hIC2P7hKstAN/4nnsUyoCxDzwEvs+73/CKjQGGO+1IkioxyCxpSlETjtRrEaqh0BQHqkf1kKEQzgjS+NAfv3DcDc3nzbp+oIdlH29Y7wwQKBgFebjZbebcfs+xTlnkkf/Q1F7mFMLGkI3wrLmHSJe8BN4kPmHbDBJQ1Oczvr72mFjFJdO2YJ18JTtnKC3CaR6ARj1vcHKVU5cvoKzsrijPdJmUYBHVNPS9wJ1Hw5iysie0mXkt1OzPvPPgG4NIfyzTiIrJW61O6o521NeXdN2pCH
cdc4857c-4d84-4333-9828-376f542d072f	15de0709-9a39-4772-b4d5-2e5bfaf7fc5f	priority	100
13132d80-fe46-4f7a-83c2-39dff2e65039	95fa2abd-845d-47fe-986f-16176365e7c4	priority	100
b3eb497e-ae4c-4ca5-8168-d75b1c081eed	d89dd713-4d07-433c-9998-a3929f042e37	certificate	MIICmzCCAYMCBgGaPD+/PzANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjUxMDMxMjE0ODIyWhcNMzUxMDMxMjE1MDAyWjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCmi7m0OIVgz9kfvKLyC8e8NUtjtf/4ssunGSILlBegPaSZYUTxBXlNPPkSZ+q4eTTEzDIlxx4Cox58/6HLtsAAfEN0bDHYQjIiCerxyfQSnzwlnU3jWZzDtUno/bj7EYmh2ZDTEkkiriycdzpHIKlWIiMyHZkOlSbdwZUHzXPvft6ylnW01IrfBk7GIYQ2g0qjtQR2RP2fNGUtW1Jv/HKhuhmOUI31or0fd+Jm8Qs6cb881bu9k8ho3wTtmbhPiHynQ9cFjBj2NBBlA7gYN1W9k779ONXQIwclgQomxTPCxuAyroUoAuhVxDcQeOp18EIOQreoTUq/D0XY1RBEej/fAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAAvn3LSXQJ1GWQUcNV9+CuzbmUcI6N/sz1hoHMxpOwRacFqyo52MufK+FycIHzl9AfZjAUUevPQ7Zfddcdi4cDQoJFSpAl780NPYRSjzESK4LYi50zlId886BXw2Kcdgh4f8cFYDLmB3/enTDpGBGY0NRnsk8Hqr16Ys1M56yj/q9MmCSi+NKVVN8ldDeoUUiy1D95ibfytA2dxBCA8U+at2C/EJJeUElkxKaGCLslYuW1YDyMlKZ+QXo6y1nCEHoIIVYo3k7hb814ENUESn8MrN+tUso7yx5EIozflovUIusu0U0O5N+Nm+QqSclB0QCfIYPbd6elxuQjvonET7tRc=
99e596fb-34c9-4835-a399-13bab0b87130	d89dd713-4d07-433c-9998-a3929f042e37	keyUse	ENC
b3c983d5-fee7-4ec6-b7dd-f37b404f639c	d89dd713-4d07-433c-9998-a3929f042e37	algorithm	RSA-OAEP
cd3c817f-1d44-40bf-a50d-8258b3cc41f4	d89dd713-4d07-433c-9998-a3929f042e37	privateKey	MIIEowIBAAKCAQEApou5tDiFYM/ZH7yi8gvHvDVLY7X/+LLLpxkiC5QXoD2kmWFE8QV5TTz5EmfquHk0xMwyJcceAqMefP+hy7bAAHxDdGwx2EIyIgnq8cn0Ep88JZ1N41mcw7VJ6P24+xGJodmQ0xJJIq4snHc6RyCpViIjMh2ZDpUm3cGVB81z737espZ1tNSK3wZOxiGENoNKo7UEdkT9nzRlLVtSb/xyoboZjlCN9aK9H3fiZvELOnG/PNW7vZPIaN8E7Zm4T4h8p0PXBYwY9jQQZQO4GDdVvZO+/TjV0CMHJYEKJsUzwsbgMq6FKALoVcQ3EHjqdfBCDkK3qE1Kvw9F2NUQRHo/3wIDAQABAoIBAASaSCBhA4DPKVaFSfpyqXEWNWwqqWD0auuAeDirshJdh5KLCM/nTl5wuNkUjfFCSP47VhN0Skk2XzUOyPmivZSRfX8FL4pfHCQfaGiI9UVienbIvyHZ/VTV1dxBWnNIBfpZ6qNXxKnXhBCmjiY1+4DJyxh8po1l+3n+V37bQJ37qVuA0+zju4S0Y1VXwmwM+R+PVZnkszSZmSYMOMiloKE+NMVwVnt4vHghmZelrasmpfY41dm/f9bFmz+TxCABG0I40f1r/IZM58GChBirJwifFVEIWt6uoNyl+mlUL5bTWZ15qxqvG2K5pgT9TRZtVeSr+D1v8/9BW4OiRY34QOkCgYEA3E8CAw/DqWuVq49eoQXb2MZVyaOEafGhVLeh5VIdS4MVWL/wYhyXf3H3YIcgNPvOuGdZY5fbdon61hO6ryc147UbCtxzAngHq7CGjMVhBWTLbN4QHxZQdcBIlUWtJJ4yb00Pu/+LDCV2MRQa/8EPJjPAnlfUS04GcmSskUaw7tUCgYEAwYb6zCsfFf6wqT1kLnnq1BnG4687d9RRUsmXg7zJhs1k0zST6hXhhuz0qsPRKjbh4hpPegAV+UYWNADhU5ag2iLi4Ri+dIyK5/fLafbgezgJ0sRfYFizNycq1yxBjIAt8VbZJ/aLOi47LwBHeINf8G8lAQxlAcN3EYffs++DFeMCgYB7SU+D7Rd+wPECD/pRvBiah+tMKtCYBRtWcGkODtTMBDA2+TqJfRyeumVIRHYWkG/PrC5O2JV9EZwonuPSzuuOYTQf8Nv/nrIUN3YkYvR3cz+PzflRnEgsjQ1RU6ugGVN6C7LpbwkeI/yvXGP7ictzgnShZ98qwSBEdehIaDntfQKBgFtER+SfdXKPAUtfG27bqkZKvcREsJvrckrDrYPANZ4wIRuF0Tf1B73049HgtTTeWxqhY9faUIKVbgUqYRllkQguqaaUX8VhPmT1NGYNuoIBxIg0efJbAnHBM+/z/BnBnWkSlyjEmZZflSOuUwZflpAyKlZbPQte3jlTRcl66+wXAoGBAIlU2bttDYQZ/vr3kfThU6+On5NFNZCdzrhUEpOxk6E0XO0tlDjoobhiwT/AX4pE5g92ZKe/Jd2cE184uaElKQ1drtZXWNTTrUe6IeFSxKbhFqVX6IHhQIK2ib5DC9gM3qQvBHwNASKGdApYPQDzzVkctADl4lP28wYEE7PPEufl
686e6469-6f17-4002-acc6-47e5bb4802bf	d89dd713-4d07-433c-9998-a3929f042e37	priority	100
8dac17b9-5c65-47df-9320-7e93e2b251c3	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	saml-role-list-mapper
b9d0125d-bd6e-4e43-bc77-658699d17852	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	oidc-full-name-mapper
1ec9c9a3-0062-4dac-a42e-8303971e0a18	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
41b9e72f-172f-4a87-85d1-5e5f5617ec7b	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	saml-user-attribute-mapper
80b3e555-5059-41bd-b5b8-0b040fe5fc25	48ef0947-2fc4-4924-82b8-cc5ed9af9504	allow-default-scopes	true
55523a76-efea-4cc8-b2c8-4d93ba6c6e48	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	saml-user-property-mapper
29aeb326-45e3-492c-82ae-91d918b784e0	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	saml-user-attribute-mapper
d75db0de-d1e8-48cd-9173-81c85a1dbdb0	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
23d3f7d7-8849-4954-affb-12b321fab4c3	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
780f508c-e167-4969-b40f-eaa4916717fe	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	oidc-address-mapper
f89cc4bd-c8bf-4ffe-9bc2-48e20f76730a	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	oidc-full-name-mapper
03dd88ef-2b59-4f24-ad68-130f2268a155	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
3af7b479-ae90-4a74-afb3-53314cf3ee9f	aaa71db2-7553-4744-ba46-5139415f2317	allowed-protocol-mapper-types	saml-role-list-mapper
21741ed2-8de4-4578-ba56-4aae552129e9	95fa2abd-845d-47fe-986f-16176365e7c4	privateKey	MIIEpAIBAAKCAQEAuHbGk23ya7k9zOscAthsAEgqqbvlJzFyJF9J5DCEFfSS7LpV0I064bN6I4fa4IRtS44QmPg9H/+OT8wzSCbGUFqMaJSa1qYE7vh/Yt8tpuXRmteezNwQP4ly/IWPP+cOUVH5th7kiu/rPs5fgby+EZTNoYi8kQadH1BMSmTVTQLPmllXjkiSnBHTPYbnmHgrtd0Xt86fx1DLhBUlzOKRX7FDhQTR1L+59/x5To3kwvp3IaKkU2XVRj+6f2TBsxzRX8R6szkVjXE0VnJHByZXqebJ0EiMnwvkzWC/8Q8LVZBu+5y45TJXn9z9uSBs/vU13aAPmxH28vPZkrF+bwrmgQIDAQABAoIBABjnzILeTuNVhO8UdVk7AEX/eGcnW9axWeBoTzE0jbjrJyU4OVrpnqAXm++NKbOznZAcc8g7iAE4f23tu6TLu23g8+Ew40EE9FiRi519VYwZrnWyFBpDwhvaAoDuxXsSxr+bClSZEjFiGEiIE6QQKDd2eFcNf6wzEObH8C0BNT1q3yp/GDSZaOxNIw8G+AOdV9gpnHGYuqYaVN1sVYa0WI15sn9gCvPwHrvmMzds4H3u3Q0pQ0uVyBakk/I8e7ciGHOuInvRL2dh84+02UsRNaBaI1NbFZAyVv85TwWHTS/IQhsunJfrezoaT+aKAplPmH5H/YWrvI2800eeeQtwECsCgYEA9AReNE2lRron9ux0pXcnnz6PC/Isc2TvT19Lo7b/jcEnXPthcAUIN29ZXC5JOQ0lkeMnBPLSBs6ydcO+WwQciSQ6lGh3h/gGwoFG3QTd/YtAoLFveOELDwdbkdw2Dz7A0cBh8hcoNrhASJq2mGYmNQWq6bzmXskd1qbxp0NzUDsCgYEAwYW+MBBC2k5RZViFN11/BzyL3pM3Jhi4zQ7ABSTVZPqTrh6EsNaWAJZpEuyQpatKUHLpfbSXk7lO53afIFGlDw5YYO8RQLmrzWzUtN8aFcRylc08JAl1lRS4K/0V5MhK6KhLfbGy9CyczwRKdvraCCb/svnzk5uC3KVsleOX1HMCgYApFVsu/yumfs0fu6vf9/HJ0+SNpFZrj0DjYi4AAF2CZlTUSNac35wEiVDIPlrBqj77Ev2Mzb0ivEY7oZs5A7YyONFMD1Kgp9erg8yEhb9CYuGcrIMSHQGZpCl8o1DOvEgGiJd1BQUWQWtBThsUCY7BOpUOCWnX55CIhU8GVErj5QKBgQCMxbYwjlOjK99n4nmdaaSy5ec09E/kpY0glT83PrEAMIrm2Qpa/O3G5aLvgihCaxS26rBQoeK1MdJk61QblWiFSEEf2ifptmZ0G1urarM17F4R/GZoLH1dAeJrFUIs10oubeXkPDRaDG3Q5WUpoZai4YOVdN8rm68YxDj128YhYwKBgQDxqN0YKl8IiMrH8p9Q2Roo2ehg8rUmF3gR1XzW3CZ9b6E/Gr1ECtgFhYH3xuxBk/wB6AtMROlQ/jG9WaEZWbj9bHXED9GJrVigWhsqp+A2fv63TPSf3uzr71tgIZ7SNz9or0n9hWxo9a8IoxbAxh+k9nldIHxhOxGd3Kbh0yI8yg==
f20ba304-ddbf-45cb-bfe4-311e2d49a85d	95fa2abd-845d-47fe-986f-16176365e7c4	keyUse	ENC
83e61d63-e6f2-42f5-a4f2-423aa34a4f8f	95fa2abd-845d-47fe-986f-16176365e7c4	algorithm	RSA-OAEP
4dddc78b-5504-4aac-bb05-80f1d19ee39c	95fa2abd-845d-47fe-986f-16176365e7c4	certificate	MIICpTCCAY0CBgGaWn6kzTANBgkqhkiG9w0BAQsFADAWMRQwEgYDVQQDDAtDbGluaWNSZWFsbTAeFw0yNTExMDYxODQ1NDBaFw0zNTExMDYxODQ3MjBaMBYxFDASBgNVBAMMC0NsaW5pY1JlYWxtMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuHbGk23ya7k9zOscAthsAEgqqbvlJzFyJF9J5DCEFfSS7LpV0I064bN6I4fa4IRtS44QmPg9H/+OT8wzSCbGUFqMaJSa1qYE7vh/Yt8tpuXRmteezNwQP4ly/IWPP+cOUVH5th7kiu/rPs5fgby+EZTNoYi8kQadH1BMSmTVTQLPmllXjkiSnBHTPYbnmHgrtd0Xt86fx1DLhBUlzOKRX7FDhQTR1L+59/x5To3kwvp3IaKkU2XVRj+6f2TBsxzRX8R6szkVjXE0VnJHByZXqebJ0EiMnwvkzWC/8Q8LVZBu+5y45TJXn9z9uSBs/vU13aAPmxH28vPZkrF+bwrmgQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBuQznvBoSLKQYLANDYFwQ8kvaAcPIoTm98e4k2pgFJTY6dkk4Gvk1zWhQ2lzGDh+Br3IYxLBbqSN4q1w7lSRlFEBfHOZHAjpu6qMSGkocnR8KXhHQ2wADDnD3UxjRzRH2KmQzZIKpWZEGyecEB6qVcMP0+zIanhh4CkaPGE0L7Ezwl5a9V7XDWglpWqf7FhD/8gTo1tg5xxaxzO3JdHhPFw2Cffv4MX+U9lEXje+mNL1m5yX5K8x6PuaMKvE7EY3ubn+19ZIa6ATLL90T/1OkgsvCDa0xM1yZVlSWwF70jW+1nlTS8fIoW8nf7p2LPNoPZ9LaGBNcExC2621hxhMx/
afb88728-383a-4a92-85c9-6d7766838cf4	86a0f33c-e705-4918-b4c4-f15f763d60c7	algorithm	HS256
0e5547a5-ae88-4b87-b87e-4fa9a02df5a8	86a0f33c-e705-4918-b4c4-f15f763d60c7	kid	d01477af-3b33-4285-940e-6c0642464301
3b36d455-f7ec-4d98-8289-2329128fb7db	86a0f33c-e705-4918-b4c4-f15f763d60c7	priority	100
05b54c50-c2a3-420f-a05d-e1589fcd30e0	86a0f33c-e705-4918-b4c4-f15f763d60c7	secret	oVKvKa4jRrd_GUV3Sf7U7y2WK2mTpq4HtwqHp0FG13j_E1eFqsHATPKeFzG1WGM5HN31guk6oDKMiJejpu1nEw
aabc0fb6-2177-4be0-a408-d972db53ced8	6f8377ed-8488-40f6-b3ba-51db4936ee73	certificate	MIICpTCCAY0CBgGaWn6jsTANBgkqhkiG9w0BAQsFADAWMRQwEgYDVQQDDAtDbGluaWNSZWFsbTAeFw0yNTExMDYxODQ1NDBaFw0zNTExMDYxODQ3MjBaMBYxFDASBgNVBAMMC0NsaW5pY1JlYWxtMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5NkmIXeNONM9hIXxaRkTcl7FSGb41lQO0nOdy+LUSxGT8XKi3JfPcVNSvbIUwrGD0JBrRYzYke6cNjywfzbUP+L82eCAbcBLb3l7tuxZbG0bnJ5P5Lobo6zstlrW9d2w3r4rKj05CL8syp9KaLuJsI7p452nrzbFlF3oGqMOEHSYd9yu4tHmtnkr8TMV26uxHX0uZMuzm57F/WFm3kQcJnbx0bFkNjpGp+U4D0YRKrq8sROptJuHWk6LPBpoTSGRVMA9XwHm5NHKcFwlppYsAcvf5Nqao6QnGlOJ/Um7uoqTcXU4x2b0NF8QUdqxu6o2UZfJ7OM73XSYWZRJYm0srwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCvCMcxHcPz/ObEzVRREvWLxh+0LO9tP5hvrPIzs8n2rBZ7G938Hbun8k67Z+QP3/F1yyef2uYia6lMklDhSfrK54fhDy12jWalbZFtavaG8tw9Wqx/CswROEW6llf8Yja1szXV4s9ffMS9sggcUrgXQylAL6I7Lek0gfEfVqX3BzS77+Jp8JJAlsIUIEhbaVybO6Fd1t9hj+rVcl0uE/h52EzLxlVTiaDsga6rNdf977ySEpCgWZenDzT0c+Sx0eNFB8Rc50Z7CXCLWD/spGgG+B9h6z0MOedrV7O5o6zZuAe05dBCa0maP5XD9pqxX5TRU3n2SVMIBthyRvsCH0I4
70e07d7f-d23b-45fb-801a-657233c609ec	6f8377ed-8488-40f6-b3ba-51db4936ee73	privateKey	MIIEogIBAAKCAQEA5NkmIXeNONM9hIXxaRkTcl7FSGb41lQO0nOdy+LUSxGT8XKi3JfPcVNSvbIUwrGD0JBrRYzYke6cNjywfzbUP+L82eCAbcBLb3l7tuxZbG0bnJ5P5Lobo6zstlrW9d2w3r4rKj05CL8syp9KaLuJsI7p452nrzbFlF3oGqMOEHSYd9yu4tHmtnkr8TMV26uxHX0uZMuzm57F/WFm3kQcJnbx0bFkNjpGp+U4D0YRKrq8sROptJuHWk6LPBpoTSGRVMA9XwHm5NHKcFwlppYsAcvf5Nqao6QnGlOJ/Um7uoqTcXU4x2b0NF8QUdqxu6o2UZfJ7OM73XSYWZRJYm0srwIDAQABAoIBAFGDVVUjX76HY4iiKwh74ZTh09SDtQummjb07pZSX7qzcqZUZlU7j6y2eKjP1xw4HZL69fKqhfOI8cRR3q4ZagWthNHYaPZuwY/dziasTffUbzrcmumGLtUggZo8hgfCZL8aLobXksqeScaMcXUXo6YraXzlSXacBEliH4vpW1eZe8qkIlF3XLUxWbYwN3aNrWJR9XmXeHNp0rOfPwQU2JxIDAHgur+ilRPKmqtRgSDeAnANCVXzijQBvJipQkOuILJTzJvS393tEKZD1J7mAt1jlQDBzX9+ttdoJ3iry75Hb+KF/Iyt8Qcm4jw9re2HtRGi6N0OEJcgrRAP3ZbZx6ECgYEA9OHF3Ctpt3KUa/4Bs93ZZmP5LxbzB/zKEhwiw1GlmIhNiEJAfdOutGL34AvGmmZ6HFLLDHnsjDaq08Owl4lWyK8p4cYTTsOVDpNK+yBEpfp26wkq7Ep/+X+hKNOZnyr8umE5CENg6/yVmlHu/X3bV7387L6nqP4l3Mwqx/b8508CgYEA7z0E0mF/a8of7UkiQ3qz4GcsmzX+l7TOFqg2k61NI7UkAhMIYYJOdRafuk8AWwW7mP4YbvYInX/9huULip9u8eX7yf9PtRQYLmERPn935JnDv40QH9xZd4YOv1t5PamrUEFAgQwofhYhm0vAJIbT+pN+2YSjxZGqjeauc4L4DKECgYBwpzCDscEHcIGREKAt46Awd0tZ+1/AS+2V2TWwzu20Nvgb+AZ9HBWhzGmluyUZQI1qXDgmvCwy8K8zjjG99KNk3RgSUjHtqRH4S5BR6K1MAeYVB/mkDD3FRI6aHoXscDUldLZs87oxtdgIzyp3mR9/xNoG+0pb9tbqNU51AU2lBwKBgCmKuu+dJncdHfYiIOT+xYVN5Rz+fzrwlmiwxOlXynFM3vfNPkNQUTdbulirpzAnCrBCTxPVfSF8PBXUZ/CmRqmSeepVfw2+c4R6Lnhfwf3cBXWZlRczOAXdLWplA+SFNc41xnGiHtXmGefRe4fcMartObWjppyD8s25JMnCEDiBAoGADRvAjFBso17OjMTwU59C/tWVzLEBll/2Td0ZSwLTHBaY1Q9lg3xshYu41Q1YTAz+MZL9qDCtI+5Lbeo6/mKBwfQfkmw4aZ8ZcIWWJf7/qlEQJB/5VFrstmIty1HWKU0S8AKok8v2Kan50vft47mMJ86Ye7QDNIf7K7ej1QTKTQc=
6fc53f27-610b-45fe-87b5-53f4b7a5e0f0	6f8377ed-8488-40f6-b3ba-51db4936ee73	keyUse	SIG
701f5a0a-c36c-4bfe-bd9f-e8c6fba1e002	6f8377ed-8488-40f6-b3ba-51db4936ee73	priority	100
fa77a01f-cd70-4af3-8b07-51ac6c10573d	82cf6d8a-4efb-4e71-9263-1fe467236855	kid	723e0916-d754-4b9f-a29d-7d59566f8b3d
b5b38e07-85c6-4d06-8d69-1a2442bd6f6b	82cf6d8a-4efb-4e71-9263-1fe467236855	priority	100
63a05ab7-0804-44da-ad23-9c004ae78dd1	82cf6d8a-4efb-4e71-9263-1fe467236855	secret	yjXGmOP5tDYXSngfaJYgAg
7e417546-a7ff-4912-9e24-240e540037ae	5955d06f-3ebe-496c-ab6e-2bed23915124	allow-default-scopes	true
a7574b10-fafa-4333-b504-16c11b5480f9	0c87388d-7d9b-4cd8-b2bb-0cd53a2f8285	max-clients	200
e5c7a2e9-1fd5-4bc4-bfbe-dc5ee51d7bbd	5a0a9bed-8190-4c6e-aa90-bf8f75356bb9	client-uris-must-match	true
2ed7e04c-6279-4c6b-8dd2-dec7eee11a4f	5a0a9bed-8190-4c6e-aa90-bf8f75356bb9	host-sending-registration-request-must-match	true
1ae3fa79-f835-4514-a8af-dc2f58ad3253	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	saml-user-property-mapper
b1e3cca9-ba84-4ab2-885c-3ea35a978251	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	oidc-address-mapper
ad37fda6-6d20-4a38-9ec6-846c4481251d	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
973dae90-29e9-4a31-92ef-bafbbbbe8984	9e8d7313-1258-4b1e-9fe7-a5a9f7a35c24	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
\.


--
-- Data for Name: composite_role; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.composite_role (composite, child_role) FROM stdin;
877980c3-44ac-4ab8-90b4-c5e493df9ec8	4f395696-ab0b-422e-a71f-ca7f18642dd4
877980c3-44ac-4ab8-90b4-c5e493df9ec8	8a9afe39-ae89-491e-acbd-7763f555de72
877980c3-44ac-4ab8-90b4-c5e493df9ec8	51eae890-ba6a-4d60-af6f-66daba2bd06c
877980c3-44ac-4ab8-90b4-c5e493df9ec8	fee0a85a-d22f-425c-823b-cb3d91aa5624
877980c3-44ac-4ab8-90b4-c5e493df9ec8	5f34ca9e-2adc-440f-992a-c427b95c168b
877980c3-44ac-4ab8-90b4-c5e493df9ec8	d0d08260-9a32-4f6a-a1ea-79345b7a5ea0
877980c3-44ac-4ab8-90b4-c5e493df9ec8	7f9138b0-fa32-45e8-baf6-b5c672cbb4cb
877980c3-44ac-4ab8-90b4-c5e493df9ec8	a81807a9-0fad-44ee-bd14-0754cc8f38f8
877980c3-44ac-4ab8-90b4-c5e493df9ec8	3c7a3793-ece1-45bb-873d-1be5f6755dce
877980c3-44ac-4ab8-90b4-c5e493df9ec8	2551d24e-ff1e-4321-8485-04dae23c0ff1
877980c3-44ac-4ab8-90b4-c5e493df9ec8	c8b3355f-fbf7-4bc0-88ca-4b3a1a0996f3
877980c3-44ac-4ab8-90b4-c5e493df9ec8	c5397447-7407-4b50-981f-eccb3b52d7c6
877980c3-44ac-4ab8-90b4-c5e493df9ec8	1fece1bc-9274-4fa5-bb81-1ba02c19f4a7
877980c3-44ac-4ab8-90b4-c5e493df9ec8	a11ddc9c-3030-49e6-b073-d53c5dfa6542
877980c3-44ac-4ab8-90b4-c5e493df9ec8	da4e9714-37c6-44a2-bbb5-7c931665b214
877980c3-44ac-4ab8-90b4-c5e493df9ec8	419fe6ca-a5ee-41a7-9d44-f1293e0b381a
877980c3-44ac-4ab8-90b4-c5e493df9ec8	16115c34-9265-4bb1-8edf-e56d87199d3f
877980c3-44ac-4ab8-90b4-c5e493df9ec8	96a8f3e9-7738-45a0-9065-198e9e38024d
5f34ca9e-2adc-440f-992a-c427b95c168b	419fe6ca-a5ee-41a7-9d44-f1293e0b381a
b3607f0d-6e82-401c-9b8c-416cbbaa811c	720c56db-c45d-469c-ba6d-3d25a71d625b
fee0a85a-d22f-425c-823b-cb3d91aa5624	da4e9714-37c6-44a2-bbb5-7c931665b214
fee0a85a-d22f-425c-823b-cb3d91aa5624	96a8f3e9-7738-45a0-9065-198e9e38024d
b3607f0d-6e82-401c-9b8c-416cbbaa811c	72f06a0b-935d-49bb-9f4e-0d81a61847bd
72f06a0b-935d-49bb-9f4e-0d81a61847bd	fdd82a1d-619c-43b9-b263-4ad3e05bf3a5
82f88671-d60d-4d4c-8282-491187470f40	07db28ce-cfbc-4bac-92b3-63afdb13f252
877980c3-44ac-4ab8-90b4-c5e493df9ec8	9f0c8559-0c2a-48c0-9ab9-201f6c92c679
b3607f0d-6e82-401c-9b8c-416cbbaa811c	cbc07a72-3b18-438b-a3db-4c090db6fb92
b3607f0d-6e82-401c-9b8c-416cbbaa811c	cddaaf39-cf86-498c-8ab2-af485e738756
877980c3-44ac-4ab8-90b4-c5e493df9ec8	974d23a0-7e0a-40b2-98c9-d920262cc727
877980c3-44ac-4ab8-90b4-c5e493df9ec8	cd0466a1-2713-4eaf-815b-510bcc599c9d
877980c3-44ac-4ab8-90b4-c5e493df9ec8	1c303e59-03b1-419c-84d1-94c4d38c8173
877980c3-44ac-4ab8-90b4-c5e493df9ec8	ed26505d-3645-44b0-ace8-f10dc63b2d2c
877980c3-44ac-4ab8-90b4-c5e493df9ec8	e14fecc6-e730-4e5b-aaf2-f6fb43faafb6
877980c3-44ac-4ab8-90b4-c5e493df9ec8	cbb016f3-3905-474c-8f87-0d8aca5119fc
877980c3-44ac-4ab8-90b4-c5e493df9ec8	429df475-bcad-4fcf-af8e-46a8416c0c7a
877980c3-44ac-4ab8-90b4-c5e493df9ec8	b1249f2f-6d77-4822-ae1f-481b269d01f1
877980c3-44ac-4ab8-90b4-c5e493df9ec8	a0364d5d-d60a-450e-b398-3a930ccc6bc2
877980c3-44ac-4ab8-90b4-c5e493df9ec8	70e249e6-3a29-4f48-8499-2a3214891dab
877980c3-44ac-4ab8-90b4-c5e493df9ec8	8a5d8214-c207-41be-b447-d26f305d32b8
877980c3-44ac-4ab8-90b4-c5e493df9ec8	183aac14-c562-4577-bf31-a5f5ad62ea9f
877980c3-44ac-4ab8-90b4-c5e493df9ec8	d564cd0f-c595-4452-89f1-603c42b7eaf7
877980c3-44ac-4ab8-90b4-c5e493df9ec8	c6e84146-e645-4fab-b809-f74ca1d15178
877980c3-44ac-4ab8-90b4-c5e493df9ec8	3a9da386-74f8-4634-891d-4cb7823b8a37
877980c3-44ac-4ab8-90b4-c5e493df9ec8	f96c4752-2981-4e91-9790-efcf6107e9e0
877980c3-44ac-4ab8-90b4-c5e493df9ec8	8cf8aa94-4b0c-4f31-a61f-4240d17a3100
1c303e59-03b1-419c-84d1-94c4d38c8173	c6e84146-e645-4fab-b809-f74ca1d15178
1c303e59-03b1-419c-84d1-94c4d38c8173	8cf8aa94-4b0c-4f31-a61f-4240d17a3100
ed26505d-3645-44b0-ace8-f10dc63b2d2c	3a9da386-74f8-4634-891d-4cb7823b8a37
96ac96ae-ad26-41e3-a0b7-127c8f125628	fc0e2819-7e78-45c7-adb7-7558170895ec
96ac96ae-ad26-41e3-a0b7-127c8f125628	d856e554-8697-46a7-bfc3-83becd03a9ae
96ac96ae-ad26-41e3-a0b7-127c8f125628	7f4555d2-adea-49a2-a14f-7e7f7385d908
96ac96ae-ad26-41e3-a0b7-127c8f125628	8407df30-99b4-4ed6-8fb4-da2955d8b36f
96ac96ae-ad26-41e3-a0b7-127c8f125628	7c9a53e7-1808-4457-a58d-da700466b711
96ac96ae-ad26-41e3-a0b7-127c8f125628	eabcb9e2-a670-4c34-b1f4-f230d3a8e6d2
96ac96ae-ad26-41e3-a0b7-127c8f125628	4cad04a7-5cf5-4e54-b645-d1baaa3fb998
96ac96ae-ad26-41e3-a0b7-127c8f125628	e76229cb-c54a-4949-b97f-081efc019e73
96ac96ae-ad26-41e3-a0b7-127c8f125628	1361c8d7-f97a-43ec-bb75-071fe839d3a6
96ac96ae-ad26-41e3-a0b7-127c8f125628	26490311-90d9-4d10-b46d-8ea08a9116f3
96ac96ae-ad26-41e3-a0b7-127c8f125628	9be7368d-b177-4d20-b638-3e653948e0fc
96ac96ae-ad26-41e3-a0b7-127c8f125628	c5d0d0e6-e1ec-4189-9b83-05cf813abb43
96ac96ae-ad26-41e3-a0b7-127c8f125628	3c331460-5a4a-4a1a-915f-860e674bdbd8
96ac96ae-ad26-41e3-a0b7-127c8f125628	19e66aae-1c8a-41fd-86b5-e24fe50d5627
96ac96ae-ad26-41e3-a0b7-127c8f125628	f58af06f-d7b7-47d7-b665-43c415237b03
96ac96ae-ad26-41e3-a0b7-127c8f125628	640f6f51-3841-4044-ab00-044b5b10f61c
96ac96ae-ad26-41e3-a0b7-127c8f125628	f066ad12-3926-4ad5-b8a8-41cc96fb12d8
7f4555d2-adea-49a2-a14f-7e7f7385d908	f066ad12-3926-4ad5-b8a8-41cc96fb12d8
7f4555d2-adea-49a2-a14f-7e7f7385d908	19e66aae-1c8a-41fd-86b5-e24fe50d5627
8407df30-99b4-4ed6-8fb4-da2955d8b36f	f58af06f-d7b7-47d7-b665-43c415237b03
9fdf86cb-8348-49f2-9423-d5ab895a17d0	d31de509-8b75-432f-b984-b387ecfa7117
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a9b03f3d-77cd-4c58-be75-1ebbb955a366
a9b03f3d-77cd-4c58-be75-1ebbb955a366	ccae7be7-650b-4da9-9e45-289fb5834ae2
4e8744a7-2551-4625-971e-da6b0d6adc10	91470240-8f25-449e-b3bd-f1c1289f67ba
877980c3-44ac-4ab8-90b4-c5e493df9ec8	180dac86-03d2-4b11-8fab-12cb3803d593
96ac96ae-ad26-41e3-a0b7-127c8f125628	20337722-16fa-46a3-90f8-af27e40ad5d0
9fdf86cb-8348-49f2-9423-d5ab895a17d0	85dafa71-06ae-4608-83b1-23989ec24c8b
9fdf86cb-8348-49f2-9423-d5ab895a17d0	9028e844-7555-43e7-a777-bf50b177aceb
\.


--
-- Data for Name: credential; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority) FROM stdin;
f98d194c-f741-42b6-a903-d96fe12d1244	\N	password	b9b1d197-52c8-4359-b642-410bdbee9a7a	1761947407697	\N	{"value":"Kaz0WulBqAaTHGl2Nq74Xo22T3dwStSQmDqmEAwC+X4=","salt":"JMVvV1GlURC9OpQa/gW72A==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
0ffa3192-2f6d-4150-9235-b230fe4fe6a7	\N	password	bfd0e61e-06bc-4312-a666-d98f407ebe71	1762454840022	\N	{"value":"WxlZxndBVoV0A09bICzmn3V29JSGU0+c0dcwEw0EY1s=","salt":"GoSuLzCLz7AILUD0dPmFBQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
ecae0c61-0aab-4df1-ace7-5b8327961f5c	\N	password	9b158f25-36dd-4d7b-8a7b-c20eb0236d16	1762454840046	\N	{"value":"ypV4VOz74mrAQZ0WVSH3bwxir4cVrJQCmXPBY0djIGg=","salt":"kU9x04c0CwQ5ODvL/hZngQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
2b07c16a-2f1f-4589-9c17-e4e203e8faa0	\N	password	1d3d59ea-7263-42ed-990e-8f53be9799c7	1762480117921	\N	{"value":"UGSRBu8cbO7E0spvRqmAyH21CP+D02FC7v08w3dEwcE=","salt":"d71r4cSXnbanKT0s5gEOGA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
efd839ce-8678-4c75-8bff-80584a787a7c	\N	password	7dee04d6-8d96-4dff-ac2b-fd0579ea2969	1763040021070	\N	{"value":"48UepSYYkQOj5Y/JFF6Z0gvVi3glU/LXMvQ7Z9B1Lls=","salt":"fVZNjVJTlKa88iS84dgoZw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
61b1ede4-27c3-40b4-bdf4-53064652dde4	\N	password	fb3da867-3ef9-49b5-b07e-d0d66d885046	1762480128678	\N	{"value":"kLg1taFjfdmoX9gpJiDaR2CqrqNPw8Ya2GzUkhnKj+0=","salt":"IY9L5oFtbhBi3bNFwYCIWw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
4170036e-4edc-49a0-94ab-2a1c2db8dbf1	\N	password	35242367-7c51-4ea3-920f-92e5b6e8b9f8	1762480132210	\N	{"value":"v9VQKK0tPwXPhZenYuUGZw+vbueUtZVoMqBQ7569Uv4=","salt":"jEDJqMlARhLil2IGnztriw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
14db44bc-05b5-43d0-bea6-c1a04d06aac2	\N	password	019e33bf-d5f8-4565-958f-702b0afdccde	1762480132472	\N	{"value":"gPoRCWistX+zuU9VqA0y3/xIc1fcS9t7AqxCUPld5uo=","salt":"QvftGC1x8lwo/pxO1JOhYg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
798b1858-9187-42a9-953b-3eeb7b629ae8	\N	password	fa15f803-68ae-4964-9854-65caa8c08032	1762480132738	\N	{"value":"y3yZR9zGw8ZOkLfxo5QteFZzdyRXH6QwNytQrhtqkeQ=","salt":"DOhAdnEWiHewNUx3Yw4pIg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
d3d2b9fd-0848-4ccb-a13f-899ee99d38ad	\N	password	62ccb310-11f1-4c17-82f9-34252d1cefe0	1762480132995	\N	{"value":"+DxzgDTbHAo2InCowJhHzPq/tAngE+69s6609SQ6iCU=","salt":"AuDSNYdLzGSWTnXP3CYElA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
45c9dd05-fa23-486d-a3e1-0fc917b1761b	\N	password	d992d8ec-090a-4031-8a0d-01bb73c92ac2	1762480133252	\N	{"value":"QGVpfisgaWXakWHoVpzB9oQuKvb2RU7OZX5mSOX2V0o=","salt":"YXFpHSoc/LbU3A+E86mqqw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
3cfbbed6-6ca6-475d-b802-7c3cf2dc8068	\N	password	7433e707-3caf-47c6-8172-1878937cfc5a	1762480133515	\N	{"value":"Kp9XD5Ck4q3Kj5+5squ5w3SHR5UNTWRKq0z6CZfbdgg=","salt":"V9HM4v8MwaP9DUvJWeNNWw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
404dafc1-bc68-4b3a-bebd-6d36f2cefc0a	\N	password	5e2651ac-874e-46ed-8bba-d88e6c5bc242	1762480133780	\N	{"value":"lMyHW8DCjrmYegNaSnD8kKCMqqnCQN4ep01QJIQCPS8=","salt":"ETtdewtVsIVj1tFy5RU9hw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
cb23ea4f-922b-46fc-a626-53313e906954	\N	password	7f2c1749-1485-43ce-a183-d64a5b002fbb	1762480134041	\N	{"value":"hfofujppfkYpTcXZ11M8r8UNGA65JI8+4oSY/LqleD4=","salt":"Vdu6PtTdeQWeFibd385LiA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
b201a5da-0e64-4be1-83bd-eca4aad45751	\N	password	6bea7c83-91ef-4db0-895c-255ce30e3722	1762480134308	\N	{"value":"7z1caxSFlYbOFqmUIZcS60oPKuGiZvInODuXF0u5Ypk=","salt":"39f6Yo3dgismmTDiyoMLRg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
2a85e3ec-3563-41f0-9411-dab305fa78fa	\N	password	de114ee3-f6ba-4f95-a20e-fde8bbad07d4	1762480134567	\N	{"value":"FAusl1A6Ca1E0ADokTZw5vgoyAuGthCtgb2N3dp/1G4=","salt":"XP/SfFyZwpzt3Bsu7cpJug==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
e5103613-c8ae-4743-ab20-c286d84ddf48	\N	password	fb292029-927c-4f18-8cba-fe6113a4d336	1762480134833	\N	{"value":"1Z0+QgoWMAFN4fAi4TPyt5uhD8gyCU49Wn3UqZvHBAU=","salt":"bO0UnQLnuHYp58TkrYVd3g==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
cd6514f4-9750-426a-879e-11dcd2ef7f61	\N	password	48ee943f-3139-4dfb-bf99-6d152213d5b9	1762480135096	\N	{"value":"ixPkx+DAovMSCU2BXrwvMa6gZ27TE1fjZWH0pbtqJYA=","salt":"boA9Ny78zk367ZHnogYP/g==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
59ad94f9-dc07-40d6-b6a3-c1ad5ef1a219	\N	password	6bb08b33-b96f-4be3-b637-ff2c05a8e831	1762574275570	\N	{"value":"q5jffU9zi5TGJgVMDPwfL+8dK5SvS43smLh3JA2I5C8=","salt":"SkuYqBRbZ/7IXsjl3SrB/A==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
2cbf1939-4795-4b86-b9d2-acb014d31abd	\N	password	4c5014a3-ff6e-473c-8dbc-a8301566e05f	1762480135361	\N	{"value":"mpLxK1onl+FeR5ostApwDhc0jSusUkIEPZv/JX3Fa+g=","salt":"v2SFuQa97rp6XI6AKkaV5Q==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
48979da2-f002-4db8-9d36-b7775586e40e	\N	password	b856117d-52a4-4099-83a6-f8a846bd09e0	1762480135644	\N	{"value":"K9o0+njWmW2xe7kDOm1FxN92C9swRUQey26Wo4SEuXc=","salt":"1Cobld6q7uz/i1JR+MQJKw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
a2fdb7f5-02fc-4685-bbfc-2e6f6b083297	\N	password	c95268c6-cc94-4c8c-b8fb-d293a0f77fe3	1762480135911	\N	{"value":"wuj/xUhsaoQFafFPNI3SWYiZzrhGSzJXig68AuVg3DY=","salt":"4n2NGm5pVHVrCWbDR4Qucg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
bf802f27-ea70-4723-8310-a65de27d1c7d	\N	password	87d9e39e-efbb-4626-857e-9c32e5b1d91e	1762480136178	\N	{"value":"MpuUtrBgtyfpDBfvRDY/P6OzCdNctbZeIenLliRU8lc=","salt":"4t/CaViCL4FPFv6nn448CQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
4532f9e4-87d8-49d1-889a-0767c2dd7edb	\N	password	44226acb-3108-4882-b778-bd6e3c72e048	1762480136435	\N	{"value":"X7rprMwYe9fp4xnllgn3CzEG0HtJ918GT3z02Jqx6ng=","salt":"xrhmZWBh689NmkWy85WiDQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
701b6a38-4989-42bc-ac12-e9f3aa8a0a7d	\N	password	d5f9731c-4592-437a-9662-8bc697b842f1	1762480136699	\N	{"value":"ChS9ON8Xa378UkVKCM37sdbWJRQHEeAk3U0FOsvNgp0=","salt":"/diSsftCiNx5tKCT5NgUhA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
8c295e0c-82a0-4a9b-b67a-5e0f78795090	\N	password	bf85900a-1052-4a89-b6d2-2ce1c2820f37	1762480136971	\N	{"value":"fDsCIKWYtqu+Lc6eGwXH+eFk1XVOIsxknheNAJZZ3WE=","salt":"68BeX3sWLb15cJ66+41BHw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
a85044b7-b68d-49b4-afa2-f748fca1f364	\N	password	a87afc68-4ad6-46ba-b5aa-24fb07921a17	1762480137323	\N	{"value":"DyqjCUSCobRCGKgz/1aIVMNeYxKdYGR8inuebi0PTFo=","salt":"yxboAuHZeaY+kG/dOs8D5A==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
13ae871d-ab9d-4381-8076-63d9a153fc8c	\N	password	29b4436d-434b-473f-9186-f5c348a8fdc8	1762480137684	\N	{"value":"qsAIeamanFmfuWOQ2o5MXI9zaE1dTD1YLzfbtto7hAo=","salt":"PAv/BZXzdHZjIC+4FSFo1w==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
f87128d1-289f-4d66-a75e-92504bfb4f85	\N	password	da01c564-3ac2-4cdd-a048-b08c5a41d027	1762480137978	\N	{"value":"IpA1M2Kz9U9l+Lv1wU+Oiu0UYCqybZU4+9+fCNgVYGE=","salt":"aLkwMEJVOscwt4mzGPKIKA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
a67cab4f-cfd2-47b9-b5a7-102fee744e9c	\N	password	4dfcb1be-b286-4174-9535-9c711ee77617	1762480138239	\N	{"value":"486WKR9viSJaABXjGD5U8CMliZZHBJEQ0+GuC+Dny/U=","salt":"AKMDIHPDTB4m2CtWycftwg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
3a8dd178-9ee8-4bfa-a81d-ca8776b8d1f9	\N	password	913f8a89-b01e-4b6f-bb1e-10e296c6eb55	1762480138508	\N	{"value":"szW1tpMfSBF2H+S4ohDjWRF4nid+bG+iBDTdCuTAk5A=","salt":"1SFye1L2QX9N1VtpP1bP9Q==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
53272b0d-c706-4f16-b822-99a8d980b09b	\N	password	a6851568-7149-47d1-a419-05732bcc3d4d	1762480138774	\N	{"value":"e/7TXJE9eDAdL42GMQasb9jZhjW921yQd78aqX2bMak=","salt":"D5mbjYOG59Ny2i/ObjYM1g==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
3f88f5fe-276d-4465-b28b-40e2fd39a4d1	\N	password	a2ccc12f-8732-4024-9cd2-da3332114799	1762480139052	\N	{"value":"lYcfe+xp6OEgunJpsTaNTn98BrF2OfcjSMg+ziSMcSY=","salt":"DYTbwaCzkefeDVZodsHbeA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
da1b2763-c6ab-4e35-a5d9-135a85fbd5be	\N	password	fd267a4b-de80-48db-ac91-e1cae71c7762	1762480139320	\N	{"value":"nFNC5fgMlcHgiKIdRSl7JQfPpUpqAqxjhYJxdZFW+2s=","salt":"JvW/iSgWH7lxM1ZZkhXUDA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
2b8189ed-9068-477c-8e18-61a8432541f1	\N	password	d49f5149-814b-4934-a12f-0b8bf859c06d	1762480139591	\N	{"value":"1RkAt0eELH2RK1SoDiRYcXq9dbPWEnQ1x5fRbJ286xk=","salt":"OsEg0ib0PRvqPtFR/CuWcw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
43c99b5a-eb32-4c00-ac76-1d845ad74b02	\N	password	a37264b4-9034-4aa8-bbbf-35da1d743031	1762480139865	\N	{"value":"UUGd5iVnKe9WudJO3RN4V2rpsY8jgM/uee/Gs3gCeY0=","salt":"JFhV2XLev470N0ijz8UBmg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
d6cb2719-3f34-48d3-b8be-7d0c29ab59f7	\N	password	7d2ddf13-187f-4732-97c2-5c72996b1d4a	1762480140133	\N	{"value":"FOWvhUYzYA6fB8n3FxmZxLwEQh5ywxoGMgBsy1XP4rg=","salt":"r//lN/QV8yG0IDo5OgTgGw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
11ed2bbb-f1df-45ea-8985-38661656f9ec	\N	password	880d0360-86c4-428a-a3ca-f5259a469336	1762480140393	\N	{"value":"Wf48rFkyN5j64QPqAqY3Smig7ic4WlnLxACQTvMNs2g=","salt":"NIG6061VfTpHOqboKcJxIQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
2fe883a3-825e-4b20-902d-cd14fe0a8469	\N	password	38a2ea8c-9dbe-486f-8dd4-2ca1f1b67d13	1762480141203	\N	{"value":"cv8kztvlmv6yFvmZmOz/IAV5IbNv7ioM3X7AQeC2fWM=","salt":"ecNj4PPrXldfovFun7zN3g==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
eb6002b4-066f-4342-9c15-01c44013277a	\N	password	bbf21422-b11e-440c-a43b-6a3ad74d433f	1762480141466	\N	{"value":"BWQuW057aQPzf97GN4yXv17v+LwU4KP+/hD/ADpachg=","salt":"xES+SZ4Ol3L71sZ2W/0YNQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
2bc417a0-b345-49c3-98e7-5e6138ce77f9	\N	password	ea78163a-6aaf-4fd4-94ff-738423b7d64d	1762574331673	\N	{"value":"zZMK2yBPov0Iz7lzbjuGh3CoX8JhCQEDqnEhXVlIaTY=","salt":"jkC1JM5ngSjtFlAO87iq8A==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
400e7951-26d2-4249-be82-53256e330916	\N	password	dad92fd4-7c2f-4347-b607-8cb949704022	1762480600644	\N	{"value":"KBHzc219LBB4DmALehaV2FDUKyTMv0UPowAaZT9U4tE=","salt":"eqRcfR05lIjTfzekSoaq0w==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
3790c836-2cc5-4dcf-a495-f6209d2e9775	\N	password	d83a9b02-f086-40ea-80d7-a2fe3dcc35a1	1762574207729	\N	{"value":"J7mFe+mYntEhozEDKBdyKKyrn3F8PsaLZ0NBk6rJ548=","salt":"dU1h53RAAMtt1gf24Iidjg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
ce7f6ca9-352d-463f-9539-0a88469a3c8a	\N	password	db2a7d0b-96a3-4530-83bc-a8a81b19cb11	1762574234769	\N	{"value":"u4+CExr5RnFe74yLM/PW1FhV02IgfzndtUdg34sBnd8=","salt":"/JvNVz4Vp/oZAnzYR/bl9A==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
53b138bd-a4c9-4334-afec-625b7cf181a0	\N	password	14d6f0b8-b678-4ce6-8609-1afe5e4d93ff	1762600593762	\N	{"value":"jCcGnPCIQg+gac1n5RwOI5OQATo9hodZPKl8n/Ci7YA=","salt":"Et/birkoOPU9fPLgleGZEg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
86be68d4-b2ec-4ee8-baab-ca270cd58477	\N	password	dd85e674-1379-41f3-9a80-b8eac1096c97	1762601327044	\N	{"value":"dOKkGbyHeUfoYiHLu3ZkbJMWJ1dQPocy3dXP8iv7awQ=","salt":"YK0QvyWqCKOfp8qQyG3/zQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
a85d481e-2590-4f4b-a453-ff2582e61c44	\N	password	6612b52d-8ec6-4ebd-a35d-c219a98fdd04	1762671540892	\N	{"value":"HbvDl+5Fl+SU+qZN1vpyupmOvbTKsJDYMRFjz5J+a3I=","salt":"fU0ftHk6aIX+v6Kp5CR3Jw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
fde40dfa-3aa8-4912-804f-38e95ddd7801	\N	password	3d1dbd09-25ca-4f02-8972-7c242c3a5c08	1762671610806	\N	{"value":"+Vt+1d0X7fFHeR5MvjNieehC07wOnBgeIKBMDUwiOtA=","salt":"d4IV10eerERl0MlUeM70kg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
baa7a160-89cf-425c-b53d-a0cbde067294	\N	password	a8e1d791-31f0-43ae-8279-da92e377e184	1762671705535	\N	{"value":"DZaTgO+zrLeA5JO7GQfMhY7rKY+rnJfI0BP4SatNpwM=","salt":"wLwEhx+xj3+uYCHZrF7Cyg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
0a6fdc07-b720-4e7a-9421-8c3d60d1871d	\N	password	0765faa9-b6ac-4fc2-9d67-163eea5d7cb3	1762671756840	\N	{"value":"rxJ5CbQ4W4rvDzXQK+ZQUj0rr2q2LKRwXAqCXkZoLek=","salt":"qJVOD1Q2u5M36ZrtE5pP2A==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
54fccdf2-a0a7-4a0c-a113-285bb7630a2c	\N	password	890607cf-d45c-4799-93ec-1d3364353c7d	1762671818728	\N	{"value":"88Jk295UBbUDQ4XeEy1r5DcWJwTQsQO52tcByoGLfMg=","salt":"2tf6lrisjbY2GIO6QSZtKg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
835b2481-d6c2-49bc-ad25-42b7b015d5a9	\N	password	675533f9-fea3-4d9d-b842-d1bed619c742	1762671870444	\N	{"value":"GKpC3dwLfSiw5cTZytSC9eqgSzsp9HbaBD+XZc7XEvo=","salt":"BEavjScHwT1+MwQDc5Qi9w==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
b8152357-d117-4fcd-870e-4336212a54d4	\N	password	065cb48f-8065-45b1-a99e-955cd5028e34	1762671930896	\N	{"value":"8hYU7bqmHmZEwgaZU5xfdkVvhgc/kmLRcVHUOWwpyTs=","salt":"BpYSUT/6FaFVPmsgPe8Ygg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
d08086c7-40e5-49ba-95fe-d00969794b08	\N	password	07d4219a-4824-4586-b749-1b2328fffd9a	1762671987863	\N	{"value":"COR6jN67VjJ3Or5WRF/glYDqbw0fjccVi0oDQlNu8HM=","salt":"wTlxJk/BVZw30GSAiVobsA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
d59719fd-836f-402a-ac1d-ab5a89485869	\N	password	a62a0cd7-9226-4db3-b514-3433420a9e22	1762672063157	\N	{"value":"A25uAoPnAGuepU8jx5N2r3IL5iRzvx6KmdvGVSP4Gvg=","salt":"TUDMGY4inj1Na3EtB/zsfQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
a1022e02-a8dd-4b2f-9aa2-dc7ea379ee2a	\N	password	6f2edc0d-f054-410c-9a48-f399a4b1147a	1762672155878	\N	{"value":"9bxbkOWLPgQHHQmsU5kTrxuwbHFXmYy9aPWH7V6/Fbk=","salt":"5nzdbubCvn8cHYAKeleakA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
9d01311e-e61e-4a99-ba72-4ec52fa520e9	\N	password	a20d17ef-a170-47f0-97e4-0b9cd6ff8361	1762672221853	\N	{"value":"T1WI1sreTzHmndXpUaOXpIXuYCXDdRLLJetSMiybd2k=","salt":"5T8WELvZHEzWtPoSaMt+xA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
dca813e5-9b44-476b-ad59-2be044ba6888	\N	password	838df798-31fb-494f-b8d7-3bcae1180513	1762672331364	\N	{"value":"0dDhlTd94LxMojLhxDC23GGzKhbzChivfwbLL6R0RZA=","salt":"8GAE0g0e6TJFVkm1YacWog==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
536996ac-5968-447f-9081-714111bbb50e	\N	password	a2e6b90e-c128-4a31-b2eb-3f92a806aafd	1762672517051	\N	{"value":"ZM6iYDOxna/jNcw/4SHwjkU1YqL7jeTrLpZ0sXf0JmQ=","salt":"IlhV2/ECyn9FB4/h4IRPlQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
02005d08-e13d-4854-a98b-dbea1a658205	\N	password	78239225-5692-45a2-b0d1-c4f811582aa2	1762957949719	\N	{"value":"LBd3yAwqz8RVik72JMhiDRaEnhi/HiCH3Of7jw7qVjA=","salt":"jILnBY303W4OEC5PVPU4EQ==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
0c8f1520-f857-43d2-a00c-e68403e8dff5	\N	password	4bc3d178-a769-4687-9e97-e71cb687c0dd	1762957949857	\N	{"value":"J4vubaz7ckLUBMDWloF95VqNQaICBb4utK7E57DyBk0=","salt":"w6bTroafi3/arslB/ju9zg==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
0d60ae53-081c-480c-ba1c-4bac35b337df	\N	password	5e6ad5b3-2470-4bf1-907c-fbc5829c53d1	1763035420049	\N	{"value":"Jq6uGxLTFAbMvXgI821Sn0ptbWc9svlxxiuw58aSGmk=","salt":"o5AVqKdXXFhAOhDb2MOjsw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
9c6974de-ae25-49a0-bb5e-fb12c6fab8af	\N	password	3cc30c6f-b742-436e-b49f-d3d3be8ae027	1763617176592	\N	{"value":"PktHdlqmKznvriww4CSqpOj/mvKT80PvneXq/WUUlq0=","salt":"+1TynknXCeGiY6Kqp+3Xvw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
e5ee2e82-f2ea-44a0-a3e3-79bf52223df6	\N	password	a749f176-9162-4782-baf2-725f598a91e9	1763617655039	\N	{"value":"lvdUmyWkVf3JjkpjCNk5HL1S3ZSrtDKwUPt155jcrIk=","salt":"r93Ooko6yMW3x1QLudh4XA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
c021a64c-13ae-41a2-aeef-0c2b45d0121f	\N	password	ad34f204-2718-4675-94e7-dd27b0f25910	1763618388410	\N	{"value":"S4Ex2FHxnONih5YPaf8xAYRoZKiThWQi6lUw2QPVl/s=","salt":"AJSH2ua+K7grAhcqwuGvOA==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
64010fd8-2260-4627-914c-084381f355a7	\N	password	ee6d1901-03fb-4e2a-9ca6-db3e6772c3c4	1763626884000	\N	{"value":"tsSlL+RdKifx+HABAfZ2GflIBoQZfPCtDf1fE/dSm/E=","salt":"9zEyRyDM5f6/dgA6XVeLfw==","additionalParameters":{}}	{"hashIterations":27500,"algorithm":"pbkdf2-sha256","additionalParameters":{}}	10
\.


--
-- Data for Name: databasechangelog; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id) FROM stdin;
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/jpa-changelog-1.0.0.Final.xml	2025-10-31 21:49:52.118567	1	EXECUTED	9:6f1016664e21e16d26517a4418f5e3df	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.23.2	\N	\N	1947390311
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/db2-jpa-changelog-1.0.0.Final.xml	2025-10-31 21:49:52.214322	2	MARK_RAN	9:828775b1596a07d1200ba1d49e5e3941	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.23.2	\N	\N	1947390311
1.1.0.Beta1	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Beta1.xml	2025-10-31 21:49:52.403306	3	EXECUTED	9:5f090e44a7d595883c1fb61f4b41fd38	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=CLIENT_ATTRIBUTES; createTable tableName=CLIENT_SESSION_NOTE; createTable tableName=APP_NODE_REGISTRATIONS; addColumn table...		\N	4.23.2	\N	\N	1947390311
1.1.0.Final	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Final.xml	2025-10-31 21:49:52.418794	4	EXECUTED	9:c07e577387a3d2c04d1adc9aaad8730e	renameColumn newColumnName=EVENT_TIME, oldColumnName=TIME, tableName=EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
1.2.0.Beta1	psilva@redhat.com	META-INF/jpa-changelog-1.2.0.Beta1.xml	2025-10-31 21:49:52.745768	5	EXECUTED	9:b68ce996c655922dbcd2fe6b6ae72686	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.23.2	\N	\N	1947390311
1.2.0.Beta1	psilva@redhat.com	META-INF/db2-jpa-changelog-1.2.0.Beta1.xml	2025-10-31 21:49:52.774319	6	MARK_RAN	9:543b5c9989f024fe35c6f6c5a97de88e	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.23.2	\N	\N	1947390311
1.2.0.RC1	bburke@redhat.com	META-INF/jpa-changelog-1.2.0.CR1.xml	2025-10-31 21:49:53.030902	7	EXECUTED	9:765afebbe21cf5bbca048e632df38336	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.23.2	\N	\N	1947390311
1.2.0.RC1	bburke@redhat.com	META-INF/db2-jpa-changelog-1.2.0.CR1.xml	2025-10-31 21:49:53.056418	8	MARK_RAN	9:db4a145ba11a6fdaefb397f6dbf829a1	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.23.2	\N	\N	1947390311
1.2.0.Final	keycloak	META-INF/jpa-changelog-1.2.0.Final.xml	2025-10-31 21:49:53.074281	9	EXECUTED	9:9d05c7be10cdb873f8bcb41bc3a8ab23	update tableName=CLIENT; update tableName=CLIENT; update tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
1.3.0	bburke@redhat.com	META-INF/jpa-changelog-1.3.0.xml	2025-10-31 21:49:53.398312	10	EXECUTED	9:18593702353128d53111f9b1ff0b82b8	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=ADMI...		\N	4.23.2	\N	\N	1947390311
1.4.0	bburke@redhat.com	META-INF/jpa-changelog-1.4.0.xml	2025-10-31 21:49:53.658623	11	EXECUTED	9:6122efe5f090e41a85c0f1c9e52cbb62	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.23.2	\N	\N	1947390311
1.4.0	bburke@redhat.com	META-INF/db2-jpa-changelog-1.4.0.xml	2025-10-31 21:49:53.688054	12	MARK_RAN	9:e1ff28bf7568451453f844c5d54bb0b5	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.23.2	\N	\N	1947390311
1.5.0	bburke@redhat.com	META-INF/jpa-changelog-1.5.0.xml	2025-10-31 21:49:53.768712	13	EXECUTED	9:7af32cd8957fbc069f796b61217483fd	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.23.2	\N	\N	1947390311
1.6.1_from15	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.889525	14	EXECUTED	9:6005e15e84714cd83226bf7879f54190	addColumn tableName=REALM; addColumn tableName=KEYCLOAK_ROLE; addColumn tableName=CLIENT; createTable tableName=OFFLINE_USER_SESSION; createTable tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_US_SES_PK2, tableName=...		\N	4.23.2	\N	\N	1947390311
1.6.1_from16-pre	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.899854	15	MARK_RAN	9:bf656f5a2b055d07f314431cae76f06c	delete tableName=OFFLINE_CLIENT_SESSION; delete tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
1.6.1_from16	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.914652	16	MARK_RAN	9:f8dadc9284440469dcf71e25ca6ab99b	dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_US_SES_PK, tableName=OFFLINE_USER_SESSION; dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_CL_SES_PK, tableName=OFFLINE_CLIENT_SESSION; addColumn tableName=OFFLINE_USER_SESSION; update tableName=OF...		\N	4.23.2	\N	\N	1947390311
1.6.1	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.930058	17	EXECUTED	9:d41d8cd98f00b204e9800998ecf8427e	empty		\N	4.23.2	\N	\N	1947390311
1.7.0	bburke@redhat.com	META-INF/jpa-changelog-1.7.0.xml	2025-10-31 21:49:54.077563	18	EXECUTED	9:3368ff0be4c2855ee2dd9ca813b38d8e	createTable tableName=KEYCLOAK_GROUP; createTable tableName=GROUP_ROLE_MAPPING; createTable tableName=GROUP_ATTRIBUTE; createTable tableName=USER_GROUP_MEMBERSHIP; createTable tableName=REALM_DEFAULT_GROUPS; addColumn tableName=IDENTITY_PROVIDER; ...		\N	4.23.2	\N	\N	1947390311
1.8.0	mposolda@redhat.com	META-INF/jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.215222	19	EXECUTED	9:8ac2fb5dd030b24c0570a763ed75ed20	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.23.2	\N	\N	1947390311
1.8.0-2	keycloak	META-INF/jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.233167	20	EXECUTED	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.23.2	\N	\N	1947390311
1.8.0	mposolda@redhat.com	META-INF/db2-jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.256626	21	MARK_RAN	9:831e82914316dc8a57dc09d755f23c51	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.23.2	\N	\N	1947390311
1.8.0-2	keycloak	META-INF/db2-jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.277659	22	MARK_RAN	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.23.2	\N	\N	1947390311
1.9.0	mposolda@redhat.com	META-INF/jpa-changelog-1.9.0.xml	2025-10-31 21:49:54.330989	23	EXECUTED	9:bc3d0f9e823a69dc21e23e94c7a94bb1	update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=REALM; update tableName=REALM; customChange; dr...		\N	4.23.2	\N	\N	1947390311
1.9.1	keycloak	META-INF/jpa-changelog-1.9.1.xml	2025-10-31 21:49:54.348479	24	EXECUTED	9:c9999da42f543575ab790e76439a2679	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=PUBLIC_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.23.2	\N	\N	1947390311
1.9.1	keycloak	META-INF/db2-jpa-changelog-1.9.1.xml	2025-10-31 21:49:54.358398	25	MARK_RAN	9:0d6c65c6f58732d81569e77b10ba301d	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.23.2	\N	\N	1947390311
1.9.2	keycloak	META-INF/jpa-changelog-1.9.2.xml	2025-10-31 21:49:54.57343	26	EXECUTED	9:fc576660fc016ae53d2d4778d84d86d0	createIndex indexName=IDX_USER_EMAIL, tableName=USER_ENTITY; createIndex indexName=IDX_USER_ROLE_MAPPING, tableName=USER_ROLE_MAPPING; createIndex indexName=IDX_USER_GROUP_MAPPING, tableName=USER_GROUP_MEMBERSHIP; createIndex indexName=IDX_USER_CO...		\N	4.23.2	\N	\N	1947390311
authz-2.0.0	psilva@redhat.com	META-INF/jpa-changelog-authz-2.0.0.xml	2025-10-31 21:49:54.887961	27	EXECUTED	9:43ed6b0da89ff77206289e87eaa9c024	createTable tableName=RESOURCE_SERVER; addPrimaryKey constraintName=CONSTRAINT_FARS, tableName=RESOURCE_SERVER; addUniqueConstraint constraintName=UK_AU8TT6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER; createTable tableName=RESOURCE_SERVER_RESOU...		\N	4.23.2	\N	\N	1947390311
authz-2.5.1	psilva@redhat.com	META-INF/jpa-changelog-authz-2.5.1.xml	2025-10-31 21:49:54.89794	28	EXECUTED	9:44bae577f551b3738740281eceb4ea70	update tableName=RESOURCE_SERVER_POLICY		\N	4.23.2	\N	\N	1947390311
2.1.0-KEYCLOAK-5461	bburke@redhat.com	META-INF/jpa-changelog-2.1.0.xml	2025-10-31 21:49:55.170036	29	EXECUTED	9:bd88e1f833df0420b01e114533aee5e8	createTable tableName=BROKER_LINK; createTable tableName=FED_USER_ATTRIBUTE; createTable tableName=FED_USER_CONSENT; createTable tableName=FED_USER_CONSENT_ROLE; createTable tableName=FED_USER_CONSENT_PROT_MAPPER; createTable tableName=FED_USER_CR...		\N	4.23.2	\N	\N	1947390311
2.2.0	bburke@redhat.com	META-INF/jpa-changelog-2.2.0.xml	2025-10-31 21:49:55.255802	30	EXECUTED	9:a7022af5267f019d020edfe316ef4371	addColumn tableName=ADMIN_EVENT_ENTITY; createTable tableName=CREDENTIAL_ATTRIBUTE; createTable tableName=FED_CREDENTIAL_ATTRIBUTE; modifyDataType columnName=VALUE, tableName=CREDENTIAL; addForeignKeyConstraint baseTableName=FED_CREDENTIAL_ATTRIBU...		\N	4.23.2	\N	\N	1947390311
2.3.0	bburke@redhat.com	META-INF/jpa-changelog-2.3.0.xml	2025-10-31 21:49:55.350118	31	EXECUTED	9:fc155c394040654d6a79227e56f5e25a	createTable tableName=FEDERATED_USER; addPrimaryKey constraintName=CONSTR_FEDERATED_USER, tableName=FEDERATED_USER; dropDefaultValue columnName=TOTP, tableName=USER_ENTITY; dropColumn columnName=TOTP, tableName=USER_ENTITY; addColumn tableName=IDE...		\N	4.23.2	\N	\N	1947390311
2.4.0	bburke@redhat.com	META-INF/jpa-changelog-2.4.0.xml	2025-10-31 21:49:55.365237	32	EXECUTED	9:eac4ffb2a14795e5dc7b426063e54d88	customChange		\N	4.23.2	\N	\N	1947390311
2.5.0	bburke@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.400096	33	EXECUTED	9:54937c05672568c4c64fc9524c1e9462	customChange; modifyDataType columnName=USER_ID, tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
2.5.0-unicode-oracle	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.416613	34	MARK_RAN	9:3a32bace77c84d7678d035a7f5a8084e	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.23.2	\N	\N	1947390311
2.5.0-unicode-other-dbs	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.740438	35	EXECUTED	9:33d72168746f81f98ae3a1e8e0ca3554	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.23.2	\N	\N	1947390311
2.5.0-duplicate-email-support	slawomir@dabek.name	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.76154	36	EXECUTED	9:61b6d3d7a4c0e0024b0c839da283da0c	addColumn tableName=REALM		\N	4.23.2	\N	\N	1947390311
2.5.0-unique-group-names	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.787582	37	EXECUTED	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
2.5.1	bburke@redhat.com	META-INF/jpa-changelog-2.5.1.xml	2025-10-31 21:49:55.801348	38	EXECUTED	9:a2b870802540cb3faa72098db5388af3	addColumn tableName=FED_USER_CONSENT		\N	4.23.2	\N	\N	1947390311
3.0.0	bburke@redhat.com	META-INF/jpa-changelog-3.0.0.xml	2025-10-31 21:49:55.817988	39	EXECUTED	9:132a67499ba24bcc54fb5cbdcfe7e4c0	addColumn tableName=IDENTITY_PROVIDER		\N	4.23.2	\N	\N	1947390311
3.2.0-fix	keycloak	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:55.826136	40	MARK_RAN	9:938f894c032f5430f2b0fafb1a243462	addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS		\N	4.23.2	\N	\N	1947390311
3.2.0-fix-with-keycloak-5416	keycloak	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:55.834326	41	MARK_RAN	9:845c332ff1874dc5d35974b0babf3006	dropIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS; addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS; createIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS		\N	4.23.2	\N	\N	1947390311
3.2.0-fix-offline-sessions	hmlnarik	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:55.853843	42	EXECUTED	9:fc86359c079781adc577c5a217e4d04c	customChange		\N	4.23.2	\N	\N	1947390311
3.2.0-fixed	keycloak	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:56.5746	43	EXECUTED	9:59a64800e3c0d09b825f8a3b444fa8f4	addColumn tableName=REALM; dropPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_PK2, tableName=OFFLINE_CLIENT_SESSION; dropColumn columnName=CLIENT_SESSION_ID, tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_P...		\N	4.23.2	\N	\N	1947390311
3.3.0	keycloak	META-INF/jpa-changelog-3.3.0.xml	2025-10-31 21:49:56.587115	44	EXECUTED	9:d48d6da5c6ccf667807f633fe489ce88	addColumn tableName=USER_ENTITY		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part1	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.604599	45	EXECUTED	9:dde36f7973e80d71fceee683bc5d2951	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_RESOURCE; addColumn tableName=RESOURCE_SERVER_SCOPE		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part2-KEYCLOAK-6095	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.61443	46	EXECUTED	9:b855e9b0a406b34fa323235a0cf4f640	customChange		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.621336	47	MARK_RAN	9:51abbacd7b416c50c4421a8cabf7927e	dropIndex indexName=IDX_RES_SERV_POL_RES_SERV, tableName=RESOURCE_SERVER_POLICY; dropIndex indexName=IDX_RES_SRV_RES_RES_SRV, tableName=RESOURCE_SERVER_RESOURCE; dropIndex indexName=IDX_RES_SRV_SCOPE_RES_SRV, tableName=RESOURCE_SERVER_SCOPE		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed-nodropindex	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.766567	48	EXECUTED	9:bdc99e567b3398bac83263d375aad143	addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_POLICY; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_RESOURCE; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, ...		\N	4.23.2	\N	\N	1947390311
authn-3.4.0.CR1-refresh-token-max-reuse	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.781406	49	EXECUTED	9:d198654156881c46bfba39abd7769e69	addColumn tableName=REALM		\N	4.23.2	\N	\N	1947390311
3.4.0	keycloak	META-INF/jpa-changelog-3.4.0.xml	2025-10-31 21:49:56.968742	50	EXECUTED	9:cfdd8736332ccdd72c5256ccb42335db	addPrimaryKey constraintName=CONSTRAINT_REALM_DEFAULT_ROLES, tableName=REALM_DEFAULT_ROLES; addPrimaryKey constraintName=CONSTRAINT_COMPOSITE_ROLE, tableName=COMPOSITE_ROLE; addPrimaryKey constraintName=CONSTR_REALM_DEFAULT_GROUPS, tableName=REALM...		\N	4.23.2	\N	\N	1947390311
3.4.0-KEYCLOAK-5230	hmlnarik@redhat.com	META-INF/jpa-changelog-3.4.0.xml	2025-10-31 21:49:57.108121	51	EXECUTED	9:7c84de3d9bd84d7f077607c1a4dcb714	createIndex indexName=IDX_FU_ATTRIBUTE, tableName=FED_USER_ATTRIBUTE; createIndex indexName=IDX_FU_CONSENT, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CONSENT_RU, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CREDENTIAL, t...		\N	4.23.2	\N	\N	1947390311
3.4.1	psilva@redhat.com	META-INF/jpa-changelog-3.4.1.xml	2025-10-31 21:49:57.117941	52	EXECUTED	9:5a6bb36cbefb6a9d6928452c0852af2d	modifyDataType columnName=VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
3.4.2	keycloak	META-INF/jpa-changelog-3.4.2.xml	2025-10-31 21:49:57.125751	53	EXECUTED	9:8f23e334dbc59f82e0a328373ca6ced0	update tableName=REALM		\N	4.23.2	\N	\N	1947390311
3.4.2-KEYCLOAK-5172	mkanis@redhat.com	META-INF/jpa-changelog-3.4.2.xml	2025-10-31 21:49:57.134931	54	EXECUTED	9:9156214268f09d970cdf0e1564d866af	update tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
4.0.0-KEYCLOAK-6335	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.157355	55	EXECUTED	9:db806613b1ed154826c02610b7dbdf74	createTable tableName=CLIENT_AUTH_FLOW_BINDINGS; addPrimaryKey constraintName=C_CLI_FLOW_BIND, tableName=CLIENT_AUTH_FLOW_BINDINGS		\N	4.23.2	\N	\N	1947390311
4.0.0-CLEANUP-UNUSED-TABLE	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.172937	56	EXECUTED	9:229a041fb72d5beac76bb94a5fa709de	dropTable tableName=CLIENT_IDENTITY_PROV_MAPPING		\N	4.23.2	\N	\N	1947390311
4.0.0-KEYCLOAK-6228	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.264902	57	EXECUTED	9:079899dade9c1e683f26b2aa9ca6ff04	dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; dropNotNullConstraint columnName=CLIENT_ID, tableName=USER_CONSENT; addColumn tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHO...		\N	4.23.2	\N	\N	1947390311
4.0.0-KEYCLOAK-5579-fixed	mposolda@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.582174	58	EXECUTED	9:139b79bcbbfe903bb1c2d2a4dbf001d9	dropForeignKeyConstraint baseTableName=CLIENT_TEMPLATE_ATTRIBUTES, constraintName=FK_CL_TEMPL_ATTR_TEMPL; renameTable newTableName=CLIENT_SCOPE_ATTRIBUTES, oldTableName=CLIENT_TEMPLATE_ATTRIBUTES; renameColumn newColumnName=SCOPE_ID, oldColumnName...		\N	4.23.2	\N	\N	1947390311
authz-4.0.0.CR1	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.CR1.xml	2025-10-31 21:49:57.688383	59	EXECUTED	9:b55738ad889860c625ba2bf483495a04	createTable tableName=RESOURCE_SERVER_PERM_TICKET; addPrimaryKey constraintName=CONSTRAINT_FAPMT, tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRHO213XCX4WNKOG82SSPMT...		\N	4.23.2	\N	\N	1947390311
authz-4.0.0.Beta3	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.Beta3.xml	2025-10-31 21:49:57.70261	60	EXECUTED	9:e0057eac39aa8fc8e09ac6cfa4ae15fe	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRPO2128CX4WNKOG82SSRFY, referencedTableName=RESOURCE_SERVER_POLICY		\N	4.23.2	\N	\N	1947390311
authz-4.2.0.Final	mhajas@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2025-10-31 21:49:57.723573	61	EXECUTED	9:42a33806f3a0443fe0e7feeec821326c	createTable tableName=RESOURCE_URIS; addForeignKeyConstraint baseTableName=RESOURCE_URIS, constraintName=FK_RESOURCE_SERVER_URIS, referencedTableName=RESOURCE_SERVER_RESOURCE; customChange; dropColumn columnName=URI, tableName=RESOURCE_SERVER_RESO...		\N	4.23.2	\N	\N	1947390311
authz-4.2.0.Final-KEYCLOAK-9944	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2025-10-31 21:49:57.752085	62	EXECUTED	9:9968206fca46eecc1f51db9c024bfe56	addPrimaryKey constraintName=CONSTRAINT_RESOUR_URIS_PK, tableName=RESOURCE_URIS		\N	4.23.2	\N	\N	1947390311
4.2.0-KEYCLOAK-6313	wadahiro@gmail.com	META-INF/jpa-changelog-4.2.0.xml	2025-10-31 21:49:57.763231	63	EXECUTED	9:92143a6daea0a3f3b8f598c97ce55c3d	addColumn tableName=REQUIRED_ACTION_PROVIDER		\N	4.23.2	\N	\N	1947390311
4.3.0-KEYCLOAK-7984	wadahiro@gmail.com	META-INF/jpa-changelog-4.3.0.xml	2025-10-31 21:49:57.771798	64	EXECUTED	9:82bab26a27195d889fb0429003b18f40	update tableName=REQUIRED_ACTION_PROVIDER		\N	4.23.2	\N	\N	1947390311
4.6.0-KEYCLOAK-7950	psilva@redhat.com	META-INF/jpa-changelog-4.6.0.xml	2025-10-31 21:49:57.778146	65	EXECUTED	9:e590c88ddc0b38b0ae4249bbfcb5abc3	update tableName=RESOURCE_SERVER_RESOURCE		\N	4.23.2	\N	\N	1947390311
4.6.0-KEYCLOAK-8377	keycloak	META-INF/jpa-changelog-4.6.0.xml	2025-10-31 21:49:57.834558	66	EXECUTED	9:5c1f475536118dbdc38d5d7977950cc0	createTable tableName=ROLE_ATTRIBUTE; addPrimaryKey constraintName=CONSTRAINT_ROLE_ATTRIBUTE_PK, tableName=ROLE_ATTRIBUTE; addForeignKeyConstraint baseTableName=ROLE_ATTRIBUTE, constraintName=FK_ROLE_ATTRIBUTE_ID, referencedTableName=KEYCLOAK_ROLE...		\N	4.23.2	\N	\N	1947390311
4.6.0-KEYCLOAK-8555	gideonray@gmail.com	META-INF/jpa-changelog-4.6.0.xml	2025-10-31 21:49:57.861721	67	EXECUTED	9:e7c9f5f9c4d67ccbbcc215440c718a17	createIndex indexName=IDX_COMPONENT_PROVIDER_TYPE, tableName=COMPONENT		\N	4.23.2	\N	\N	1947390311
4.7.0-KEYCLOAK-1267	sguilhen@redhat.com	META-INF/jpa-changelog-4.7.0.xml	2025-10-31 21:49:57.873614	68	EXECUTED	9:88e0bfdda924690d6f4e430c53447dd5	addColumn tableName=REALM		\N	4.23.2	\N	\N	1947390311
4.7.0-KEYCLOAK-7275	keycloak	META-INF/jpa-changelog-4.7.0.xml	2025-10-31 21:49:57.908827	69	EXECUTED	9:f53177f137e1c46b6a88c59ec1cb5218	renameColumn newColumnName=CREATED_ON, oldColumnName=LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION; addNotNullConstraint columnName=CREATED_ON, tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_USER_SESSION; customChange; createIn...		\N	4.23.2	\N	\N	1947390311
4.8.0-KEYCLOAK-8835	sguilhen@redhat.com	META-INF/jpa-changelog-4.8.0.xml	2025-10-31 21:49:57.924695	70	EXECUTED	9:a74d33da4dc42a37ec27121580d1459f	addNotNullConstraint columnName=SSO_MAX_LIFESPAN_REMEMBER_ME, tableName=REALM; addNotNullConstraint columnName=SSO_IDLE_TIMEOUT_REMEMBER_ME, tableName=REALM		\N	4.23.2	\N	\N	1947390311
authz-7.0.0-KEYCLOAK-10443	psilva@redhat.com	META-INF/jpa-changelog-authz-7.0.0.xml	2025-10-31 21:49:57.941446	71	EXECUTED	9:fd4ade7b90c3b67fae0bfcfcb42dfb5f	addColumn tableName=RESOURCE_SERVER		\N	4.23.2	\N	\N	1947390311
8.0.0-adding-credential-columns	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:57.958198	72	EXECUTED	9:aa072ad090bbba210d8f18781b8cebf4	addColumn tableName=CREDENTIAL; addColumn tableName=FED_USER_CREDENTIAL		\N	4.23.2	\N	\N	1947390311
8.0.0-updating-credential-data-not-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:57.974571	73	EXECUTED	9:1ae6be29bab7c2aa376f6983b932be37	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.23.2	\N	\N	1947390311
8.0.0-updating-credential-data-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:57.981483	74	MARK_RAN	9:14706f286953fc9a25286dbd8fb30d97	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.23.2	\N	\N	1947390311
8.0.0-credential-cleanup-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:58.008719	75	EXECUTED	9:2b9cc12779be32c5b40e2e67711a218b	dropDefaultValue columnName=COUNTER, tableName=CREDENTIAL; dropDefaultValue columnName=DIGITS, tableName=CREDENTIAL; dropDefaultValue columnName=PERIOD, tableName=CREDENTIAL; dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; dropColumn ...		\N	4.23.2	\N	\N	1947390311
8.0.0-resource-tag-support	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:58.038101	76	EXECUTED	9:91fa186ce7a5af127a2d7a91ee083cc5	addColumn tableName=MIGRATION_MODEL; createIndex indexName=IDX_UPDATE_TIME, tableName=MIGRATION_MODEL		\N	4.23.2	\N	\N	1947390311
9.0.0-always-display-client	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.050639	77	EXECUTED	9:6335e5c94e83a2639ccd68dd24e2e5ad	addColumn tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
9.0.0-drop-constraints-for-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.057402	78	MARK_RAN	9:6bdb5658951e028bfe16fa0a8228b530	dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5PMT, tableName=RESOURCE_SERVER_PERM_TICKET; dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER_RESOURCE; dropPrimaryKey constraintName=CONSTRAINT_O...		\N	4.23.2	\N	\N	1947390311
9.0.0-increase-column-size-federated-fk	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.112737	79	EXECUTED	9:d5bc15a64117ccad481ce8792d4c608f	modifyDataType columnName=CLIENT_ID, tableName=FED_USER_CONSENT; modifyDataType columnName=CLIENT_REALM_CONSTRAINT, tableName=KEYCLOAK_ROLE; modifyDataType columnName=OWNER, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=CLIENT_ID, ta...		\N	4.23.2	\N	\N	1947390311
9.0.0-recreate-constraints-after-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.132798	80	MARK_RAN	9:077cba51999515f4d3e7ad5619ab592c	addNotNullConstraint columnName=CLIENT_ID, tableName=OFFLINE_CLIENT_SESSION; addNotNullConstraint columnName=OWNER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNullConstraint columnName=REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNull...		\N	4.23.2	\N	\N	1947390311
9.0.1-add-index-to-client.client_id	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.156871	81	EXECUTED	9:be969f08a163bf47c6b9e9ead8ac2afb	createIndex indexName=IDX_CLIENT_ID, tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
9.0.1-KEYCLOAK-12579-drop-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.163794	82	MARK_RAN	9:6d3bb4408ba5a72f39bd8a0b301ec6e3	dropUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
9.0.1-KEYCLOAK-12579-add-not-null-constraint	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.185213	83	EXECUTED	9:966bda61e46bebf3cc39518fbed52fa7	addNotNullConstraint columnName=PARENT_GROUP, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
9.0.1-KEYCLOAK-12579-recreate-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.192961	84	MARK_RAN	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
9.0.1-add-index-to-events	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.219019	85	EXECUTED	9:7d93d602352a30c0c317e6a609b56599	createIndex indexName=IDX_EVENT_TIME, tableName=EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
map-remove-ri	keycloak	META-INF/jpa-changelog-11.0.0.xml	2025-10-31 21:49:58.22996	86	EXECUTED	9:71c5969e6cdd8d7b6f47cebc86d37627	dropForeignKeyConstraint baseTableName=REALM, constraintName=FK_TRAF444KK6QRKMS7N56AIWQ5Y; dropForeignKeyConstraint baseTableName=KEYCLOAK_ROLE, constraintName=FK_KJHO5LE2C0RAL09FL8CM9WFW9		\N	4.23.2	\N	\N	1947390311
map-remove-ri	keycloak	META-INF/jpa-changelog-12.0.0.xml	2025-10-31 21:49:58.244747	87	EXECUTED	9:a9ba7d47f065f041b7da856a81762021	dropForeignKeyConstraint baseTableName=REALM_DEFAULT_GROUPS, constraintName=FK_DEF_GROUPS_GROUP; dropForeignKeyConstraint baseTableName=REALM_DEFAULT_ROLES, constraintName=FK_H4WPD7W4HSOOLNI3H0SW7BTJE; dropForeignKeyConstraint baseTableName=CLIENT...		\N	4.23.2	\N	\N	1947390311
12.1.0-add-realm-localization-table	keycloak	META-INF/jpa-changelog-12.0.0.xml	2025-10-31 21:49:58.287288	88	EXECUTED	9:fffabce2bc01e1a8f5110d5278500065	createTable tableName=REALM_LOCALIZATIONS; addPrimaryKey tableName=REALM_LOCALIZATIONS		\N	4.23.2	\N	\N	1947390311
default-roles	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.313065	89	EXECUTED	9:fa8a5b5445e3857f4b010bafb5009957	addColumn tableName=REALM; customChange		\N	4.23.2	\N	\N	1947390311
default-roles-cleanup	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.334703	90	EXECUTED	9:67ac3241df9a8582d591c5ed87125f39	dropTable tableName=REALM_DEFAULT_ROLES; dropTable tableName=CLIENT_DEFAULT_ROLES		\N	4.23.2	\N	\N	1947390311
13.0.0-KEYCLOAK-16844	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.366116	91	EXECUTED	9:ad1194d66c937e3ffc82386c050ba089	createIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
map-remove-ri-13.0.0	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.389614	92	EXECUTED	9:d9be619d94af5a2f5d07b9f003543b91	dropForeignKeyConstraint baseTableName=DEFAULT_CLIENT_SCOPE, constraintName=FK_R_DEF_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SCOPE_CLIENT, constraintName=FK_C_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SC...		\N	4.23.2	\N	\N	1947390311
13.0.0-KEYCLOAK-17992-drop-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.394679	93	MARK_RAN	9:544d201116a0fcc5a5da0925fbbc3bde	dropPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CLSCOPE_CL, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CL_CLSCOPE, tableName=CLIENT_SCOPE_CLIENT		\N	4.23.2	\N	\N	1947390311
13.0.0-increase-column-size-federated	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.426276	94	EXECUTED	9:43c0c1055b6761b4b3e89de76d612ccf	modifyDataType columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; modifyDataType columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT		\N	4.23.2	\N	\N	1947390311
13.0.0-KEYCLOAK-17992-recreate-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.432389	95	MARK_RAN	9:8bd711fd0330f4fe980494ca43ab1139	addNotNullConstraint columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; addNotNullConstraint columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT; addPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; createIndex indexName=...		\N	4.23.2	\N	\N	1947390311
json-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.446544	96	EXECUTED	9:e07d2bc0970c348bb06fb63b1f82ddbf	addColumn tableName=REALM_ATTRIBUTE; update tableName=REALM_ATTRIBUTE; dropColumn columnName=VALUE, tableName=REALM_ATTRIBUTE; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=REALM_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-11019	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.512316	97	EXECUTED	9:24fb8611e97f29989bea412aa38d12b7	createIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USER, tableName=OFFLINE_USER_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.518584	98	MARK_RAN	9:259f89014ce2506ee84740cbf7163aa7	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286-revert	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.553353	99	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286-supported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.588588	100	EXECUTED	9:60ca84a0f8c94ec8c3504a5a3bc88ee8	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286-unsupported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.596427	101	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
KEYCLOAK-17267-add-index-to-user-attributes	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.624321	102	EXECUTED	9:0b305d8d1277f3a89a0a53a659ad274c	createIndex indexName=IDX_USER_ATTRIBUTE_NAME, tableName=USER_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
KEYCLOAK-18146-add-saml-art-binding-identifier	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.635391	103	EXECUTED	9:2c374ad2cdfe20e2905a84c8fac48460	customChange		\N	4.23.2	\N	\N	1947390311
15.0.0-KEYCLOAK-18467	keycloak	META-INF/jpa-changelog-15.0.0.xml	2025-10-31 21:49:58.654571	104	EXECUTED	9:47a760639ac597360a8219f5b768b4de	addColumn tableName=REALM_LOCALIZATIONS; update tableName=REALM_LOCALIZATIONS; dropColumn columnName=TEXTS, tableName=REALM_LOCALIZATIONS; renameColumn newColumnName=TEXTS, oldColumnName=TEXTS_NEW, tableName=REALM_LOCALIZATIONS; addNotNullConstrai...		\N	4.23.2	\N	\N	1947390311
17.0.0-9562	keycloak	META-INF/jpa-changelog-17.0.0.xml	2025-10-31 21:49:58.686825	105	EXECUTED	9:a6272f0576727dd8cad2522335f5d99e	createIndex indexName=IDX_USER_SERVICE_ACCOUNT, tableName=USER_ENTITY		\N	4.23.2	\N	\N	1947390311
18.0.0-10625-IDX_ADMIN_EVENT_TIME	keycloak	META-INF/jpa-changelog-18.0.0.xml	2025-10-31 21:49:58.713335	106	EXECUTED	9:015479dbd691d9cc8669282f4828c41d	createIndex indexName=IDX_ADMIN_EVENT_TIME, tableName=ADMIN_EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
19.0.0-10135	keycloak	META-INF/jpa-changelog-19.0.0.xml	2025-10-31 21:49:58.722985	107	EXECUTED	9:9518e495fdd22f78ad6425cc30630221	customChange		\N	4.23.2	\N	\N	1947390311
20.0.0-12964-supported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2025-10-31 21:49:58.752297	108	EXECUTED	9:e5f243877199fd96bcc842f27a1656ac	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
20.0.0-12964-unsupported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2025-10-31 21:49:58.758592	109	MARK_RAN	9:1a6fcaa85e20bdeae0a9ce49b41946a5	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
client-attributes-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-20.0.0.xml	2025-10-31 21:49:58.777003	110	EXECUTED	9:3f332e13e90739ed0c35b0b25b7822ca	addColumn tableName=CLIENT_ATTRIBUTES; update tableName=CLIENT_ATTRIBUTES; dropColumn columnName=VALUE, tableName=CLIENT_ATTRIBUTES; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
21.0.2-17277	keycloak	META-INF/jpa-changelog-21.0.2.xml	2025-10-31 21:49:58.788104	111	EXECUTED	9:7ee1f7a3fb8f5588f171fb9a6ab623c0	customChange		\N	4.23.2	\N	\N	1947390311
21.1.0-19404	keycloak	META-INF/jpa-changelog-21.1.0.xml	2025-10-31 21:49:58.948766	112	EXECUTED	9:3d7e830b52f33676b9d64f7f2b2ea634	modifyDataType columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=LOGIC, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=POLICY_ENFORCE_MODE, tableName=RESOURCE_SERVER		\N	4.23.2	\N	\N	1947390311
21.1.0-19404-2	keycloak	META-INF/jpa-changelog-21.1.0.xml	2025-10-31 21:49:58.95697	113	MARK_RAN	9:627d032e3ef2c06c0e1f73d2ae25c26c	addColumn tableName=RESOURCE_SERVER_POLICY; update tableName=RESOURCE_SERVER_POLICY; dropColumn columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; renameColumn newColumnName=DECISION_STRATEGY, oldColumnName=DECISION_STRATEGY_NEW, tabl...		\N	4.23.2	\N	\N	1947390311
22.0.0-17484-updated	keycloak	META-INF/jpa-changelog-22.0.0.xml	2025-10-31 21:49:58.968483	114	EXECUTED	9:90af0bfd30cafc17b9f4d6eccd92b8b3	customChange		\N	4.23.2	\N	\N	1947390311
22.0.5-24031	keycloak	META-INF/jpa-changelog-22.0.0.xml	2025-10-31 21:49:58.977031	115	MARK_RAN	9:a60d2d7b315ec2d3eba9e2f145f9df28	customChange		\N	4.23.2	\N	\N	1947390311
23.0.0-12062	keycloak	META-INF/jpa-changelog-23.0.0.xml	2025-10-31 21:49:58.995985	116	EXECUTED	9:2168fbe728fec46ae9baf15bf80927b8	addColumn tableName=COMPONENT_CONFIG; update tableName=COMPONENT_CONFIG; dropColumn columnName=VALUE, tableName=COMPONENT_CONFIG; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=COMPONENT_CONFIG		\N	4.23.2	\N	\N	1947390311
23.0.0-17258	keycloak	META-INF/jpa-changelog-23.0.0.xml	2025-10-31 21:49:59.008794	117	EXECUTED	9:36506d679a83bbfda85a27ea1864dca8	addColumn tableName=EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/jpa-changelog-1.0.0.Final.xml	2025-10-31 21:49:52.118567	1	EXECUTED	9:6f1016664e21e16d26517a4418f5e3df	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.23.2	\N	\N	1947390311
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/db2-jpa-changelog-1.0.0.Final.xml	2025-10-31 21:49:52.214322	2	MARK_RAN	9:828775b1596a07d1200ba1d49e5e3941	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.23.2	\N	\N	1947390311
1.1.0.Beta1	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Beta1.xml	2025-10-31 21:49:52.403306	3	EXECUTED	9:5f090e44a7d595883c1fb61f4b41fd38	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=CLIENT_ATTRIBUTES; createTable tableName=CLIENT_SESSION_NOTE; createTable tableName=APP_NODE_REGISTRATIONS; addColumn table...		\N	4.23.2	\N	\N	1947390311
1.1.0.Final	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Final.xml	2025-10-31 21:49:52.418794	4	EXECUTED	9:c07e577387a3d2c04d1adc9aaad8730e	renameColumn newColumnName=EVENT_TIME, oldColumnName=TIME, tableName=EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
1.2.0.Beta1	psilva@redhat.com	META-INF/jpa-changelog-1.2.0.Beta1.xml	2025-10-31 21:49:52.745768	5	EXECUTED	9:b68ce996c655922dbcd2fe6b6ae72686	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.23.2	\N	\N	1947390311
1.2.0.Beta1	psilva@redhat.com	META-INF/db2-jpa-changelog-1.2.0.Beta1.xml	2025-10-31 21:49:52.774319	6	MARK_RAN	9:543b5c9989f024fe35c6f6c5a97de88e	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.23.2	\N	\N	1947390311
1.2.0.RC1	bburke@redhat.com	META-INF/jpa-changelog-1.2.0.CR1.xml	2025-10-31 21:49:53.030902	7	EXECUTED	9:765afebbe21cf5bbca048e632df38336	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.23.2	\N	\N	1947390311
1.2.0.RC1	bburke@redhat.com	META-INF/db2-jpa-changelog-1.2.0.CR1.xml	2025-10-31 21:49:53.056418	8	MARK_RAN	9:db4a145ba11a6fdaefb397f6dbf829a1	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.23.2	\N	\N	1947390311
1.2.0.Final	keycloak	META-INF/jpa-changelog-1.2.0.Final.xml	2025-10-31 21:49:53.074281	9	EXECUTED	9:9d05c7be10cdb873f8bcb41bc3a8ab23	update tableName=CLIENT; update tableName=CLIENT; update tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
1.3.0	bburke@redhat.com	META-INF/jpa-changelog-1.3.0.xml	2025-10-31 21:49:53.398312	10	EXECUTED	9:18593702353128d53111f9b1ff0b82b8	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=ADMI...		\N	4.23.2	\N	\N	1947390311
1.4.0	bburke@redhat.com	META-INF/jpa-changelog-1.4.0.xml	2025-10-31 21:49:53.658623	11	EXECUTED	9:6122efe5f090e41a85c0f1c9e52cbb62	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.23.2	\N	\N	1947390311
1.4.0	bburke@redhat.com	META-INF/db2-jpa-changelog-1.4.0.xml	2025-10-31 21:49:53.688054	12	MARK_RAN	9:e1ff28bf7568451453f844c5d54bb0b5	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.23.2	\N	\N	1947390311
1.5.0	bburke@redhat.com	META-INF/jpa-changelog-1.5.0.xml	2025-10-31 21:49:53.768712	13	EXECUTED	9:7af32cd8957fbc069f796b61217483fd	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.23.2	\N	\N	1947390311
1.6.1_from15	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.889525	14	EXECUTED	9:6005e15e84714cd83226bf7879f54190	addColumn tableName=REALM; addColumn tableName=KEYCLOAK_ROLE; addColumn tableName=CLIENT; createTable tableName=OFFLINE_USER_SESSION; createTable tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_US_SES_PK2, tableName=...		\N	4.23.2	\N	\N	1947390311
1.6.1_from16-pre	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.899854	15	MARK_RAN	9:bf656f5a2b055d07f314431cae76f06c	delete tableName=OFFLINE_CLIENT_SESSION; delete tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
1.6.1_from16	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.914652	16	MARK_RAN	9:f8dadc9284440469dcf71e25ca6ab99b	dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_US_SES_PK, tableName=OFFLINE_USER_SESSION; dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_CL_SES_PK, tableName=OFFLINE_CLIENT_SESSION; addColumn tableName=OFFLINE_USER_SESSION; update tableName=OF...		\N	4.23.2	\N	\N	1947390311
1.6.1	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2025-10-31 21:49:53.930058	17	EXECUTED	9:d41d8cd98f00b204e9800998ecf8427e	empty		\N	4.23.2	\N	\N	1947390311
1.7.0	bburke@redhat.com	META-INF/jpa-changelog-1.7.0.xml	2025-10-31 21:49:54.077563	18	EXECUTED	9:3368ff0be4c2855ee2dd9ca813b38d8e	createTable tableName=KEYCLOAK_GROUP; createTable tableName=GROUP_ROLE_MAPPING; createTable tableName=GROUP_ATTRIBUTE; createTable tableName=USER_GROUP_MEMBERSHIP; createTable tableName=REALM_DEFAULT_GROUPS; addColumn tableName=IDENTITY_PROVIDER; ...		\N	4.23.2	\N	\N	1947390311
1.8.0	mposolda@redhat.com	META-INF/jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.215222	19	EXECUTED	9:8ac2fb5dd030b24c0570a763ed75ed20	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.23.2	\N	\N	1947390311
1.8.0-2	keycloak	META-INF/jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.233167	20	EXECUTED	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.23.2	\N	\N	1947390311
1.8.0	mposolda@redhat.com	META-INF/db2-jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.256626	21	MARK_RAN	9:831e82914316dc8a57dc09d755f23c51	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.23.2	\N	\N	1947390311
1.8.0-2	keycloak	META-INF/db2-jpa-changelog-1.8.0.xml	2025-10-31 21:49:54.277659	22	MARK_RAN	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.23.2	\N	\N	1947390311
1.9.0	mposolda@redhat.com	META-INF/jpa-changelog-1.9.0.xml	2025-10-31 21:49:54.330989	23	EXECUTED	9:bc3d0f9e823a69dc21e23e94c7a94bb1	update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=REALM; update tableName=REALM; customChange; dr...		\N	4.23.2	\N	\N	1947390311
1.9.1	keycloak	META-INF/jpa-changelog-1.9.1.xml	2025-10-31 21:49:54.348479	24	EXECUTED	9:c9999da42f543575ab790e76439a2679	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=PUBLIC_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.23.2	\N	\N	1947390311
1.9.1	keycloak	META-INF/db2-jpa-changelog-1.9.1.xml	2025-10-31 21:49:54.358398	25	MARK_RAN	9:0d6c65c6f58732d81569e77b10ba301d	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.23.2	\N	\N	1947390311
1.9.2	keycloak	META-INF/jpa-changelog-1.9.2.xml	2025-10-31 21:49:54.57343	26	EXECUTED	9:fc576660fc016ae53d2d4778d84d86d0	createIndex indexName=IDX_USER_EMAIL, tableName=USER_ENTITY; createIndex indexName=IDX_USER_ROLE_MAPPING, tableName=USER_ROLE_MAPPING; createIndex indexName=IDX_USER_GROUP_MAPPING, tableName=USER_GROUP_MEMBERSHIP; createIndex indexName=IDX_USER_CO...		\N	4.23.2	\N	\N	1947390311
authz-2.0.0	psilva@redhat.com	META-INF/jpa-changelog-authz-2.0.0.xml	2025-10-31 21:49:54.887961	27	EXECUTED	9:43ed6b0da89ff77206289e87eaa9c024	createTable tableName=RESOURCE_SERVER; addPrimaryKey constraintName=CONSTRAINT_FARS, tableName=RESOURCE_SERVER; addUniqueConstraint constraintName=UK_AU8TT6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER; createTable tableName=RESOURCE_SERVER_RESOU...		\N	4.23.2	\N	\N	1947390311
authz-2.5.1	psilva@redhat.com	META-INF/jpa-changelog-authz-2.5.1.xml	2025-10-31 21:49:54.89794	28	EXECUTED	9:44bae577f551b3738740281eceb4ea70	update tableName=RESOURCE_SERVER_POLICY		\N	4.23.2	\N	\N	1947390311
2.1.0-KEYCLOAK-5461	bburke@redhat.com	META-INF/jpa-changelog-2.1.0.xml	2025-10-31 21:49:55.170036	29	EXECUTED	9:bd88e1f833df0420b01e114533aee5e8	createTable tableName=BROKER_LINK; createTable tableName=FED_USER_ATTRIBUTE; createTable tableName=FED_USER_CONSENT; createTable tableName=FED_USER_CONSENT_ROLE; createTable tableName=FED_USER_CONSENT_PROT_MAPPER; createTable tableName=FED_USER_CR...		\N	4.23.2	\N	\N	1947390311
2.2.0	bburke@redhat.com	META-INF/jpa-changelog-2.2.0.xml	2025-10-31 21:49:55.255802	30	EXECUTED	9:a7022af5267f019d020edfe316ef4371	addColumn tableName=ADMIN_EVENT_ENTITY; createTable tableName=CREDENTIAL_ATTRIBUTE; createTable tableName=FED_CREDENTIAL_ATTRIBUTE; modifyDataType columnName=VALUE, tableName=CREDENTIAL; addForeignKeyConstraint baseTableName=FED_CREDENTIAL_ATTRIBU...		\N	4.23.2	\N	\N	1947390311
2.3.0	bburke@redhat.com	META-INF/jpa-changelog-2.3.0.xml	2025-10-31 21:49:55.350118	31	EXECUTED	9:fc155c394040654d6a79227e56f5e25a	createTable tableName=FEDERATED_USER; addPrimaryKey constraintName=CONSTR_FEDERATED_USER, tableName=FEDERATED_USER; dropDefaultValue columnName=TOTP, tableName=USER_ENTITY; dropColumn columnName=TOTP, tableName=USER_ENTITY; addColumn tableName=IDE...		\N	4.23.2	\N	\N	1947390311
2.4.0	bburke@redhat.com	META-INF/jpa-changelog-2.4.0.xml	2025-10-31 21:49:55.365237	32	EXECUTED	9:eac4ffb2a14795e5dc7b426063e54d88	customChange		\N	4.23.2	\N	\N	1947390311
2.5.0	bburke@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.400096	33	EXECUTED	9:54937c05672568c4c64fc9524c1e9462	customChange; modifyDataType columnName=USER_ID, tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
2.5.0-unicode-oracle	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.416613	34	MARK_RAN	9:3a32bace77c84d7678d035a7f5a8084e	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.23.2	\N	\N	1947390311
2.5.0-unicode-other-dbs	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.740438	35	EXECUTED	9:33d72168746f81f98ae3a1e8e0ca3554	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.23.2	\N	\N	1947390311
2.5.0-duplicate-email-support	slawomir@dabek.name	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.76154	36	EXECUTED	9:61b6d3d7a4c0e0024b0c839da283da0c	addColumn tableName=REALM		\N	4.23.2	\N	\N	1947390311
2.5.0-unique-group-names	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2025-10-31 21:49:55.787582	37	EXECUTED	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
2.5.1	bburke@redhat.com	META-INF/jpa-changelog-2.5.1.xml	2025-10-31 21:49:55.801348	38	EXECUTED	9:a2b870802540cb3faa72098db5388af3	addColumn tableName=FED_USER_CONSENT		\N	4.23.2	\N	\N	1947390311
3.0.0	bburke@redhat.com	META-INF/jpa-changelog-3.0.0.xml	2025-10-31 21:49:55.817988	39	EXECUTED	9:132a67499ba24bcc54fb5cbdcfe7e4c0	addColumn tableName=IDENTITY_PROVIDER		\N	4.23.2	\N	\N	1947390311
3.2.0-fix	keycloak	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:55.826136	40	MARK_RAN	9:938f894c032f5430f2b0fafb1a243462	addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS		\N	4.23.2	\N	\N	1947390311
3.2.0-fix-with-keycloak-5416	keycloak	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:55.834326	41	MARK_RAN	9:845c332ff1874dc5d35974b0babf3006	dropIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS; addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS; createIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS		\N	4.23.2	\N	\N	1947390311
3.2.0-fix-offline-sessions	hmlnarik	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:55.853843	42	EXECUTED	9:fc86359c079781adc577c5a217e4d04c	customChange		\N	4.23.2	\N	\N	1947390311
3.2.0-fixed	keycloak	META-INF/jpa-changelog-3.2.0.xml	2025-10-31 21:49:56.5746	43	EXECUTED	9:59a64800e3c0d09b825f8a3b444fa8f4	addColumn tableName=REALM; dropPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_PK2, tableName=OFFLINE_CLIENT_SESSION; dropColumn columnName=CLIENT_SESSION_ID, tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_P...		\N	4.23.2	\N	\N	1947390311
3.3.0	keycloak	META-INF/jpa-changelog-3.3.0.xml	2025-10-31 21:49:56.587115	44	EXECUTED	9:d48d6da5c6ccf667807f633fe489ce88	addColumn tableName=USER_ENTITY		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part1	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.604599	45	EXECUTED	9:dde36f7973e80d71fceee683bc5d2951	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_RESOURCE; addColumn tableName=RESOURCE_SERVER_SCOPE		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part2-KEYCLOAK-6095	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.61443	46	EXECUTED	9:b855e9b0a406b34fa323235a0cf4f640	customChange		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.621336	47	MARK_RAN	9:51abbacd7b416c50c4421a8cabf7927e	dropIndex indexName=IDX_RES_SERV_POL_RES_SERV, tableName=RESOURCE_SERVER_POLICY; dropIndex indexName=IDX_RES_SRV_RES_RES_SRV, tableName=RESOURCE_SERVER_RESOURCE; dropIndex indexName=IDX_RES_SRV_SCOPE_RES_SRV, tableName=RESOURCE_SERVER_SCOPE		\N	4.23.2	\N	\N	1947390311
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed-nodropindex	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.766567	48	EXECUTED	9:bdc99e567b3398bac83263d375aad143	addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_POLICY; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_RESOURCE; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, ...		\N	4.23.2	\N	\N	1947390311
authn-3.4.0.CR1-refresh-token-max-reuse	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2025-10-31 21:49:56.781406	49	EXECUTED	9:d198654156881c46bfba39abd7769e69	addColumn tableName=REALM		\N	4.23.2	\N	\N	1947390311
3.4.0	keycloak	META-INF/jpa-changelog-3.4.0.xml	2025-10-31 21:49:56.968742	50	EXECUTED	9:cfdd8736332ccdd72c5256ccb42335db	addPrimaryKey constraintName=CONSTRAINT_REALM_DEFAULT_ROLES, tableName=REALM_DEFAULT_ROLES; addPrimaryKey constraintName=CONSTRAINT_COMPOSITE_ROLE, tableName=COMPOSITE_ROLE; addPrimaryKey constraintName=CONSTR_REALM_DEFAULT_GROUPS, tableName=REALM...		\N	4.23.2	\N	\N	1947390311
3.4.0-KEYCLOAK-5230	hmlnarik@redhat.com	META-INF/jpa-changelog-3.4.0.xml	2025-10-31 21:49:57.108121	51	EXECUTED	9:7c84de3d9bd84d7f077607c1a4dcb714	createIndex indexName=IDX_FU_ATTRIBUTE, tableName=FED_USER_ATTRIBUTE; createIndex indexName=IDX_FU_CONSENT, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CONSENT_RU, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CREDENTIAL, t...		\N	4.23.2	\N	\N	1947390311
3.4.1	psilva@redhat.com	META-INF/jpa-changelog-3.4.1.xml	2025-10-31 21:49:57.117941	52	EXECUTED	9:5a6bb36cbefb6a9d6928452c0852af2d	modifyDataType columnName=VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
3.4.2	keycloak	META-INF/jpa-changelog-3.4.2.xml	2025-10-31 21:49:57.125751	53	EXECUTED	9:8f23e334dbc59f82e0a328373ca6ced0	update tableName=REALM		\N	4.23.2	\N	\N	1947390311
3.4.2-KEYCLOAK-5172	mkanis@redhat.com	META-INF/jpa-changelog-3.4.2.xml	2025-10-31 21:49:57.134931	54	EXECUTED	9:9156214268f09d970cdf0e1564d866af	update tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
4.0.0-KEYCLOAK-6335	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.157355	55	EXECUTED	9:db806613b1ed154826c02610b7dbdf74	createTable tableName=CLIENT_AUTH_FLOW_BINDINGS; addPrimaryKey constraintName=C_CLI_FLOW_BIND, tableName=CLIENT_AUTH_FLOW_BINDINGS		\N	4.23.2	\N	\N	1947390311
4.0.0-CLEANUP-UNUSED-TABLE	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.172937	56	EXECUTED	9:229a041fb72d5beac76bb94a5fa709de	dropTable tableName=CLIENT_IDENTITY_PROV_MAPPING		\N	4.23.2	\N	\N	1947390311
4.0.0-KEYCLOAK-6228	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.264902	57	EXECUTED	9:079899dade9c1e683f26b2aa9ca6ff04	dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; dropNotNullConstraint columnName=CLIENT_ID, tableName=USER_CONSENT; addColumn tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHO...		\N	4.23.2	\N	\N	1947390311
4.0.0-KEYCLOAK-5579-fixed	mposolda@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2025-10-31 21:49:57.582174	58	EXECUTED	9:139b79bcbbfe903bb1c2d2a4dbf001d9	dropForeignKeyConstraint baseTableName=CLIENT_TEMPLATE_ATTRIBUTES, constraintName=FK_CL_TEMPL_ATTR_TEMPL; renameTable newTableName=CLIENT_SCOPE_ATTRIBUTES, oldTableName=CLIENT_TEMPLATE_ATTRIBUTES; renameColumn newColumnName=SCOPE_ID, oldColumnName...		\N	4.23.2	\N	\N	1947390311
authz-4.0.0.CR1	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.CR1.xml	2025-10-31 21:49:57.688383	59	EXECUTED	9:b55738ad889860c625ba2bf483495a04	createTable tableName=RESOURCE_SERVER_PERM_TICKET; addPrimaryKey constraintName=CONSTRAINT_FAPMT, tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRHO213XCX4WNKOG82SSPMT...		\N	4.23.2	\N	\N	1947390311
authz-4.0.0.Beta3	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.Beta3.xml	2025-10-31 21:49:57.70261	60	EXECUTED	9:e0057eac39aa8fc8e09ac6cfa4ae15fe	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRPO2128CX4WNKOG82SSRFY, referencedTableName=RESOURCE_SERVER_POLICY		\N	4.23.2	\N	\N	1947390311
authz-4.2.0.Final	mhajas@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2025-10-31 21:49:57.723573	61	EXECUTED	9:42a33806f3a0443fe0e7feeec821326c	createTable tableName=RESOURCE_URIS; addForeignKeyConstraint baseTableName=RESOURCE_URIS, constraintName=FK_RESOURCE_SERVER_URIS, referencedTableName=RESOURCE_SERVER_RESOURCE; customChange; dropColumn columnName=URI, tableName=RESOURCE_SERVER_RESO...		\N	4.23.2	\N	\N	1947390311
authz-4.2.0.Final-KEYCLOAK-9944	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2025-10-31 21:49:57.752085	62	EXECUTED	9:9968206fca46eecc1f51db9c024bfe56	addPrimaryKey constraintName=CONSTRAINT_RESOUR_URIS_PK, tableName=RESOURCE_URIS		\N	4.23.2	\N	\N	1947390311
4.2.0-KEYCLOAK-6313	wadahiro@gmail.com	META-INF/jpa-changelog-4.2.0.xml	2025-10-31 21:49:57.763231	63	EXECUTED	9:92143a6daea0a3f3b8f598c97ce55c3d	addColumn tableName=REQUIRED_ACTION_PROVIDER		\N	4.23.2	\N	\N	1947390311
4.3.0-KEYCLOAK-7984	wadahiro@gmail.com	META-INF/jpa-changelog-4.3.0.xml	2025-10-31 21:49:57.771798	64	EXECUTED	9:82bab26a27195d889fb0429003b18f40	update tableName=REQUIRED_ACTION_PROVIDER		\N	4.23.2	\N	\N	1947390311
4.6.0-KEYCLOAK-7950	psilva@redhat.com	META-INF/jpa-changelog-4.6.0.xml	2025-10-31 21:49:57.778146	65	EXECUTED	9:e590c88ddc0b38b0ae4249bbfcb5abc3	update tableName=RESOURCE_SERVER_RESOURCE		\N	4.23.2	\N	\N	1947390311
4.6.0-KEYCLOAK-8377	keycloak	META-INF/jpa-changelog-4.6.0.xml	2025-10-31 21:49:57.834558	66	EXECUTED	9:5c1f475536118dbdc38d5d7977950cc0	createTable tableName=ROLE_ATTRIBUTE; addPrimaryKey constraintName=CONSTRAINT_ROLE_ATTRIBUTE_PK, tableName=ROLE_ATTRIBUTE; addForeignKeyConstraint baseTableName=ROLE_ATTRIBUTE, constraintName=FK_ROLE_ATTRIBUTE_ID, referencedTableName=KEYCLOAK_ROLE...		\N	4.23.2	\N	\N	1947390311
4.6.0-KEYCLOAK-8555	gideonray@gmail.com	META-INF/jpa-changelog-4.6.0.xml	2025-10-31 21:49:57.861721	67	EXECUTED	9:e7c9f5f9c4d67ccbbcc215440c718a17	createIndex indexName=IDX_COMPONENT_PROVIDER_TYPE, tableName=COMPONENT		\N	4.23.2	\N	\N	1947390311
4.7.0-KEYCLOAK-1267	sguilhen@redhat.com	META-INF/jpa-changelog-4.7.0.xml	2025-10-31 21:49:57.873614	68	EXECUTED	9:88e0bfdda924690d6f4e430c53447dd5	addColumn tableName=REALM		\N	4.23.2	\N	\N	1947390311
4.7.0-KEYCLOAK-7275	keycloak	META-INF/jpa-changelog-4.7.0.xml	2025-10-31 21:49:57.908827	69	EXECUTED	9:f53177f137e1c46b6a88c59ec1cb5218	renameColumn newColumnName=CREATED_ON, oldColumnName=LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION; addNotNullConstraint columnName=CREATED_ON, tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_USER_SESSION; customChange; createIn...		\N	4.23.2	\N	\N	1947390311
4.8.0-KEYCLOAK-8835	sguilhen@redhat.com	META-INF/jpa-changelog-4.8.0.xml	2025-10-31 21:49:57.924695	70	EXECUTED	9:a74d33da4dc42a37ec27121580d1459f	addNotNullConstraint columnName=SSO_MAX_LIFESPAN_REMEMBER_ME, tableName=REALM; addNotNullConstraint columnName=SSO_IDLE_TIMEOUT_REMEMBER_ME, tableName=REALM		\N	4.23.2	\N	\N	1947390311
authz-7.0.0-KEYCLOAK-10443	psilva@redhat.com	META-INF/jpa-changelog-authz-7.0.0.xml	2025-10-31 21:49:57.941446	71	EXECUTED	9:fd4ade7b90c3b67fae0bfcfcb42dfb5f	addColumn tableName=RESOURCE_SERVER		\N	4.23.2	\N	\N	1947390311
8.0.0-adding-credential-columns	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:57.958198	72	EXECUTED	9:aa072ad090bbba210d8f18781b8cebf4	addColumn tableName=CREDENTIAL; addColumn tableName=FED_USER_CREDENTIAL		\N	4.23.2	\N	\N	1947390311
8.0.0-updating-credential-data-not-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:57.974571	73	EXECUTED	9:1ae6be29bab7c2aa376f6983b932be37	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.23.2	\N	\N	1947390311
8.0.0-updating-credential-data-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:57.981483	74	MARK_RAN	9:14706f286953fc9a25286dbd8fb30d97	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.23.2	\N	\N	1947390311
8.0.0-credential-cleanup-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:58.008719	75	EXECUTED	9:2b9cc12779be32c5b40e2e67711a218b	dropDefaultValue columnName=COUNTER, tableName=CREDENTIAL; dropDefaultValue columnName=DIGITS, tableName=CREDENTIAL; dropDefaultValue columnName=PERIOD, tableName=CREDENTIAL; dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; dropColumn ...		\N	4.23.2	\N	\N	1947390311
8.0.0-resource-tag-support	keycloak	META-INF/jpa-changelog-8.0.0.xml	2025-10-31 21:49:58.038101	76	EXECUTED	9:91fa186ce7a5af127a2d7a91ee083cc5	addColumn tableName=MIGRATION_MODEL; createIndex indexName=IDX_UPDATE_TIME, tableName=MIGRATION_MODEL		\N	4.23.2	\N	\N	1947390311
9.0.0-always-display-client	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.050639	77	EXECUTED	9:6335e5c94e83a2639ccd68dd24e2e5ad	addColumn tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
9.0.0-drop-constraints-for-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.057402	78	MARK_RAN	9:6bdb5658951e028bfe16fa0a8228b530	dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5PMT, tableName=RESOURCE_SERVER_PERM_TICKET; dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER_RESOURCE; dropPrimaryKey constraintName=CONSTRAINT_O...		\N	4.23.2	\N	\N	1947390311
9.0.0-increase-column-size-federated-fk	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.112737	79	EXECUTED	9:d5bc15a64117ccad481ce8792d4c608f	modifyDataType columnName=CLIENT_ID, tableName=FED_USER_CONSENT; modifyDataType columnName=CLIENT_REALM_CONSTRAINT, tableName=KEYCLOAK_ROLE; modifyDataType columnName=OWNER, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=CLIENT_ID, ta...		\N	4.23.2	\N	\N	1947390311
9.0.0-recreate-constraints-after-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2025-10-31 21:49:58.132798	80	MARK_RAN	9:077cba51999515f4d3e7ad5619ab592c	addNotNullConstraint columnName=CLIENT_ID, tableName=OFFLINE_CLIENT_SESSION; addNotNullConstraint columnName=OWNER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNullConstraint columnName=REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNull...		\N	4.23.2	\N	\N	1947390311
9.0.1-add-index-to-client.client_id	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.156871	81	EXECUTED	9:be969f08a163bf47c6b9e9ead8ac2afb	createIndex indexName=IDX_CLIENT_ID, tableName=CLIENT		\N	4.23.2	\N	\N	1947390311
9.0.1-KEYCLOAK-12579-drop-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.163794	82	MARK_RAN	9:6d3bb4408ba5a72f39bd8a0b301ec6e3	dropUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
9.0.1-KEYCLOAK-12579-add-not-null-constraint	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.185213	83	EXECUTED	9:966bda61e46bebf3cc39518fbed52fa7	addNotNullConstraint columnName=PARENT_GROUP, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
9.0.1-KEYCLOAK-12579-recreate-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.192961	84	MARK_RAN	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.23.2	\N	\N	1947390311
9.0.1-add-index-to-events	keycloak	META-INF/jpa-changelog-9.0.1.xml	2025-10-31 21:49:58.219019	85	EXECUTED	9:7d93d602352a30c0c317e6a609b56599	createIndex indexName=IDX_EVENT_TIME, tableName=EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
map-remove-ri	keycloak	META-INF/jpa-changelog-11.0.0.xml	2025-10-31 21:49:58.22996	86	EXECUTED	9:71c5969e6cdd8d7b6f47cebc86d37627	dropForeignKeyConstraint baseTableName=REALM, constraintName=FK_TRAF444KK6QRKMS7N56AIWQ5Y; dropForeignKeyConstraint baseTableName=KEYCLOAK_ROLE, constraintName=FK_KJHO5LE2C0RAL09FL8CM9WFW9		\N	4.23.2	\N	\N	1947390311
map-remove-ri	keycloak	META-INF/jpa-changelog-12.0.0.xml	2025-10-31 21:49:58.244747	87	EXECUTED	9:a9ba7d47f065f041b7da856a81762021	dropForeignKeyConstraint baseTableName=REALM_DEFAULT_GROUPS, constraintName=FK_DEF_GROUPS_GROUP; dropForeignKeyConstraint baseTableName=REALM_DEFAULT_ROLES, constraintName=FK_H4WPD7W4HSOOLNI3H0SW7BTJE; dropForeignKeyConstraint baseTableName=CLIENT...		\N	4.23.2	\N	\N	1947390311
12.1.0-add-realm-localization-table	keycloak	META-INF/jpa-changelog-12.0.0.xml	2025-10-31 21:49:58.287288	88	EXECUTED	9:fffabce2bc01e1a8f5110d5278500065	createTable tableName=REALM_LOCALIZATIONS; addPrimaryKey tableName=REALM_LOCALIZATIONS		\N	4.23.2	\N	\N	1947390311
default-roles	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.313065	89	EXECUTED	9:fa8a5b5445e3857f4b010bafb5009957	addColumn tableName=REALM; customChange		\N	4.23.2	\N	\N	1947390311
default-roles-cleanup	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.334703	90	EXECUTED	9:67ac3241df9a8582d591c5ed87125f39	dropTable tableName=REALM_DEFAULT_ROLES; dropTable tableName=CLIENT_DEFAULT_ROLES		\N	4.23.2	\N	\N	1947390311
13.0.0-KEYCLOAK-16844	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.366116	91	EXECUTED	9:ad1194d66c937e3ffc82386c050ba089	createIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
map-remove-ri-13.0.0	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.389614	92	EXECUTED	9:d9be619d94af5a2f5d07b9f003543b91	dropForeignKeyConstraint baseTableName=DEFAULT_CLIENT_SCOPE, constraintName=FK_R_DEF_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SCOPE_CLIENT, constraintName=FK_C_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SC...		\N	4.23.2	\N	\N	1947390311
13.0.0-KEYCLOAK-17992-drop-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.394679	93	MARK_RAN	9:544d201116a0fcc5a5da0925fbbc3bde	dropPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CLSCOPE_CL, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CL_CLSCOPE, tableName=CLIENT_SCOPE_CLIENT		\N	4.23.2	\N	\N	1947390311
13.0.0-increase-column-size-federated	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.426276	94	EXECUTED	9:43c0c1055b6761b4b3e89de76d612ccf	modifyDataType columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; modifyDataType columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT		\N	4.23.2	\N	\N	1947390311
13.0.0-KEYCLOAK-17992-recreate-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.432389	95	MARK_RAN	9:8bd711fd0330f4fe980494ca43ab1139	addNotNullConstraint columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; addNotNullConstraint columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT; addPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; createIndex indexName=...		\N	4.23.2	\N	\N	1947390311
json-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-13.0.0.xml	2025-10-31 21:49:58.446544	96	EXECUTED	9:e07d2bc0970c348bb06fb63b1f82ddbf	addColumn tableName=REALM_ATTRIBUTE; update tableName=REALM_ATTRIBUTE; dropColumn columnName=VALUE, tableName=REALM_ATTRIBUTE; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=REALM_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-11019	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.512316	97	EXECUTED	9:24fb8611e97f29989bea412aa38d12b7	createIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USER, tableName=OFFLINE_USER_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.518584	98	MARK_RAN	9:259f89014ce2506ee84740cbf7163aa7	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286-revert	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.553353	99	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286-supported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.588588	100	EXECUTED	9:60ca84a0f8c94ec8c3504a5a3bc88ee8	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
14.0.0-KEYCLOAK-18286-unsupported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.596427	101	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
KEYCLOAK-17267-add-index-to-user-attributes	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.624321	102	EXECUTED	9:0b305d8d1277f3a89a0a53a659ad274c	createIndex indexName=IDX_USER_ATTRIBUTE_NAME, tableName=USER_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
KEYCLOAK-18146-add-saml-art-binding-identifier	keycloak	META-INF/jpa-changelog-14.0.0.xml	2025-10-31 21:49:58.635391	103	EXECUTED	9:2c374ad2cdfe20e2905a84c8fac48460	customChange		\N	4.23.2	\N	\N	1947390311
15.0.0-KEYCLOAK-18467	keycloak	META-INF/jpa-changelog-15.0.0.xml	2025-10-31 21:49:58.654571	104	EXECUTED	9:47a760639ac597360a8219f5b768b4de	addColumn tableName=REALM_LOCALIZATIONS; update tableName=REALM_LOCALIZATIONS; dropColumn columnName=TEXTS, tableName=REALM_LOCALIZATIONS; renameColumn newColumnName=TEXTS, oldColumnName=TEXTS_NEW, tableName=REALM_LOCALIZATIONS; addNotNullConstrai...		\N	4.23.2	\N	\N	1947390311
17.0.0-9562	keycloak	META-INF/jpa-changelog-17.0.0.xml	2025-10-31 21:49:58.686825	105	EXECUTED	9:a6272f0576727dd8cad2522335f5d99e	createIndex indexName=IDX_USER_SERVICE_ACCOUNT, tableName=USER_ENTITY		\N	4.23.2	\N	\N	1947390311
18.0.0-10625-IDX_ADMIN_EVENT_TIME	keycloak	META-INF/jpa-changelog-18.0.0.xml	2025-10-31 21:49:58.713335	106	EXECUTED	9:015479dbd691d9cc8669282f4828c41d	createIndex indexName=IDX_ADMIN_EVENT_TIME, tableName=ADMIN_EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
19.0.0-10135	keycloak	META-INF/jpa-changelog-19.0.0.xml	2025-10-31 21:49:58.722985	107	EXECUTED	9:9518e495fdd22f78ad6425cc30630221	customChange		\N	4.23.2	\N	\N	1947390311
20.0.0-12964-supported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2025-10-31 21:49:58.752297	108	EXECUTED	9:e5f243877199fd96bcc842f27a1656ac	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
20.0.0-12964-unsupported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2025-10-31 21:49:58.758592	109	MARK_RAN	9:1a6fcaa85e20bdeae0a9ce49b41946a5	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.23.2	\N	\N	1947390311
client-attributes-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-20.0.0.xml	2025-10-31 21:49:58.777003	110	EXECUTED	9:3f332e13e90739ed0c35b0b25b7822ca	addColumn tableName=CLIENT_ATTRIBUTES; update tableName=CLIENT_ATTRIBUTES; dropColumn columnName=VALUE, tableName=CLIENT_ATTRIBUTES; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=CLIENT_ATTRIBUTES		\N	4.23.2	\N	\N	1947390311
21.0.2-17277	keycloak	META-INF/jpa-changelog-21.0.2.xml	2025-10-31 21:49:58.788104	111	EXECUTED	9:7ee1f7a3fb8f5588f171fb9a6ab623c0	customChange		\N	4.23.2	\N	\N	1947390311
21.1.0-19404	keycloak	META-INF/jpa-changelog-21.1.0.xml	2025-10-31 21:49:58.948766	112	EXECUTED	9:3d7e830b52f33676b9d64f7f2b2ea634	modifyDataType columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=LOGIC, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=POLICY_ENFORCE_MODE, tableName=RESOURCE_SERVER		\N	4.23.2	\N	\N	1947390311
21.1.0-19404-2	keycloak	META-INF/jpa-changelog-21.1.0.xml	2025-10-31 21:49:58.95697	113	MARK_RAN	9:627d032e3ef2c06c0e1f73d2ae25c26c	addColumn tableName=RESOURCE_SERVER_POLICY; update tableName=RESOURCE_SERVER_POLICY; dropColumn columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; renameColumn newColumnName=DECISION_STRATEGY, oldColumnName=DECISION_STRATEGY_NEW, tabl...		\N	4.23.2	\N	\N	1947390311
22.0.0-17484-updated	keycloak	META-INF/jpa-changelog-22.0.0.xml	2025-10-31 21:49:58.968483	114	EXECUTED	9:90af0bfd30cafc17b9f4d6eccd92b8b3	customChange		\N	4.23.2	\N	\N	1947390311
22.0.5-24031	keycloak	META-INF/jpa-changelog-22.0.0.xml	2025-10-31 21:49:58.977031	115	MARK_RAN	9:a60d2d7b315ec2d3eba9e2f145f9df28	customChange		\N	4.23.2	\N	\N	1947390311
23.0.0-12062	keycloak	META-INF/jpa-changelog-23.0.0.xml	2025-10-31 21:49:58.995985	116	EXECUTED	9:2168fbe728fec46ae9baf15bf80927b8	addColumn tableName=COMPONENT_CONFIG; update tableName=COMPONENT_CONFIG; dropColumn columnName=VALUE, tableName=COMPONENT_CONFIG; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=COMPONENT_CONFIG		\N	4.23.2	\N	\N	1947390311
23.0.0-17258	keycloak	META-INF/jpa-changelog-23.0.0.xml	2025-10-31 21:49:59.008794	117	EXECUTED	9:36506d679a83bbfda85a27ea1864dca8	addColumn tableName=EVENT_ENTITY		\N	4.23.2	\N	\N	1947390311
\.


--
-- Data for Name: databasechangeloglock; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.databasechangeloglock (id, locked, lockgranted, lockedby) FROM stdin;
1	f	\N	\N
1000	f	\N	\N
1001	f	\N	\N
\.


--
-- Data for Name: default_client_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.default_client_scope (realm_id, scope_id, default_scope) FROM stdin;
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	3b223e82-9319-4436-a3ac-b4df4c3382b0	f
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	3fc2a2c7-8e2d-43d3-86e5-a954797c1069	t
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d	t
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	bab05a29-9c5c-4e69-9413-0fddb2ebe402	t
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	3d4f589c-f733-4181-9900-f8061e8fd29c	f
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	6ce76ede-d612-4715-93a6-179246514501	f
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	89829ff3-f089-4c29-a729-b750ba3d3138	t
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	7980e866-3958-4e29-a615-6595735efaec	t
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	853bf943-afd8-4571-9892-abca3a489513	f
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e6407edd-4d85-4bd0-8e87-2b82f68b06cf	t
39799f2c-4662-4089-918d-99875bb5d615	03c28e19-3bea-4089-8ea6-d1e07cb2b245	f
39799f2c-4662-4089-918d-99875bb5d615	66d84b40-237a-478e-b178-1b87cd943a14	t
39799f2c-4662-4089-918d-99875bb5d615	973c248d-715b-444f-8235-efec1a8ca602	t
39799f2c-4662-4089-918d-99875bb5d615	ffab2650-2172-4056-84d7-e5e4db9ba524	t
39799f2c-4662-4089-918d-99875bb5d615	fb732bce-d898-4f3e-994c-f7641047accd	f
39799f2c-4662-4089-918d-99875bb5d615	42ce5674-7218-4105-b076-68ffdba861c2	f
39799f2c-4662-4089-918d-99875bb5d615	91617ee0-425c-4a3b-9794-44953bf73618	t
39799f2c-4662-4089-918d-99875bb5d615	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba	t
39799f2c-4662-4089-918d-99875bb5d615	48526f32-1519-4fea-a921-dcc083551af2	f
39799f2c-4662-4089-918d-99875bb5d615	23e798cb-f10c-44a4-a465-473f300db2b7	t
\.


--
-- Data for Name: event_entity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.event_entity (id, client_id, details_json, error, ip_address, realm_id, session_id, event_time, type, user_id, details_json_long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_attribute (id, name, user_id, realm_id, storage_provider_id, value) FROM stdin;
\.


--
-- Data for Name: fed_user_consent; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_consent (id, client_id, user_id, realm_id, storage_provider_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: fed_user_consent_cl_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_consent_cl_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: fed_user_credential; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_credential (id, salt, type, created_date, user_id, realm_id, storage_provider_id, user_label, secret_data, credential_data, priority) FROM stdin;
\.


--
-- Data for Name: fed_user_group_membership; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_group_membership (group_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_required_action; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_required_action (required_action, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_role_mapping (role_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: federated_identity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.federated_identity (identity_provider, realm_id, federated_user_id, federated_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: federated_user; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.federated_user (id, storage_provider_id, realm_id) FROM stdin;
\.


--
-- Data for Name: group_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.group_attribute (id, name, value, group_id) FROM stdin;
\.


--
-- Data for Name: group_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.group_role_mapping (role_id, group_id) FROM stdin;
\.


--
-- Data for Name: identity_provider; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.identity_provider (internal_id, enabled, provider_alias, provider_id, store_token, authenticate_by_default, realm_id, add_token_role, trust_email, first_broker_login_flow_id, post_broker_login_flow_id, provider_display_name, link_only) FROM stdin;
\.


--
-- Data for Name: identity_provider_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.identity_provider_config (identity_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: identity_provider_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.identity_provider_mapper (id, name, idp_alias, idp_mapper_name, realm_id) FROM stdin;
\.


--
-- Data for Name: idp_mapper_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.idp_mapper_config (idp_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: keycloak_group; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.keycloak_group (id, name, parent_group, realm_id) FROM stdin;
\.


--
-- Data for Name: keycloak_role; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.keycloak_role (id, client_realm_constraint, client_role, description, name, realm_id, client, realm) FROM stdin;
b3607f0d-6e82-401c-9b8c-416cbbaa811c	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	${role_default-roles}	default-roles-master	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	\N
4f395696-ab0b-422e-a71f-ca7f18642dd4	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	${role_create-realm}	create-realm	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	\N
877980c3-44ac-4ab8-90b4-c5e493df9ec8	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	${role_admin}	admin	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	\N
8a9afe39-ae89-491e-acbd-7763f555de72	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_create-client}	create-client	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
51eae890-ba6a-4d60-af6f-66daba2bd06c	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_view-realm}	view-realm	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
fee0a85a-d22f-425c-823b-cb3d91aa5624	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_view-users}	view-users	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
5f34ca9e-2adc-440f-992a-c427b95c168b	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_view-clients}	view-clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
d0d08260-9a32-4f6a-a1ea-79345b7a5ea0	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_view-events}	view-events	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
7f9138b0-fa32-45e8-baf6-b5c672cbb4cb	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_view-identity-providers}	view-identity-providers	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
a81807a9-0fad-44ee-bd14-0754cc8f38f8	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_view-authorization}	view-authorization	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
3c7a3793-ece1-45bb-873d-1be5f6755dce	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_manage-realm}	manage-realm	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
2551d24e-ff1e-4321-8485-04dae23c0ff1	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_manage-users}	manage-users	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
c8b3355f-fbf7-4bc0-88ca-4b3a1a0996f3	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_manage-clients}	manage-clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
c5397447-7407-4b50-981f-eccb3b52d7c6	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_manage-events}	manage-events	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
1fece1bc-9274-4fa5-bb81-1ba02c19f4a7	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_manage-identity-providers}	manage-identity-providers	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
a11ddc9c-3030-49e6-b073-d53c5dfa6542	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_manage-authorization}	manage-authorization	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
da4e9714-37c6-44a2-bbb5-7c931665b214	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_query-users}	query-users	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
419fe6ca-a5ee-41a7-9d44-f1293e0b381a	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_query-clients}	query-clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
16115c34-9265-4bb1-8edf-e56d87199d3f	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_query-realms}	query-realms	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
96a8f3e9-7738-45a0-9065-198e9e38024d	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_query-groups}	query-groups	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
720c56db-c45d-469c-ba6d-3d25a71d625b	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_view-profile}	view-profile	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
72f06a0b-935d-49bb-9f4e-0d81a61847bd	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_manage-account}	manage-account	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
fdd82a1d-619c-43b9-b263-4ad3e05bf3a5	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_manage-account-links}	manage-account-links	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
4b4e21c5-e434-4cfe-bb06-afd0f7ff5c3a	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_view-applications}	view-applications	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
07db28ce-cfbc-4bac-92b3-63afdb13f252	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_view-consent}	view-consent	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
82f88671-d60d-4d4c-8282-491187470f40	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_manage-consent}	manage-consent	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
71c7305f-e38e-4e29-9c30-aa7a8c95e555	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_view-groups}	view-groups	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
beb04928-ff6c-45be-b70c-8a569a0819d7	e047e211-4b1f-48d9-8e30-1cd8ff641961	t	${role_delete-account}	delete-account	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e047e211-4b1f-48d9-8e30-1cd8ff641961	\N
e8d657d3-516e-44c1-ba59-f02ec468d54a	622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	t	${role_read-token}	read-token	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	622ec7c9-cd9b-4610-8fa9-fa4fd08addc4	\N
9f0c8559-0c2a-48c0-9ab9-201f6c92c679	e952156e-f82e-4d72-bc50-8814ff85661f	t	${role_impersonation}	impersonation	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	e952156e-f82e-4d72-bc50-8814ff85661f	\N
cbc07a72-3b18-438b-a3db-4c090db6fb92	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	${role_offline-access}	offline_access	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	\N
cddaaf39-cf86-498c-8ab2-af485e738756	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	${role_uma_authorization}	uma_authorization	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	\N	\N
72304f89-5c75-42f2-a84b-2c56da7807d1	39799f2c-4662-4089-918d-99875bb5d615	f	Cardiology specialist doctor	doctor_cardiology	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
b96a0605-0119-4f91-9cb9-00f160e846b1	39799f2c-4662-4089-918d-99875bb5d615	f	Dentistry specialist doctor	doctor_dentistry	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
9fdf86cb-8348-49f2-9423-d5ab895a17d0	39799f2c-4662-4089-918d-99875bb5d615	f	${role_default-roles}	default-roles-clinicrealm	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
974d23a0-7e0a-40b2-98c9-d920262cc727	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_create-client}	create-client	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
cd0466a1-2713-4eaf-815b-510bcc599c9d	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_view-realm}	view-realm	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
1c303e59-03b1-419c-84d1-94c4d38c8173	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_view-users}	view-users	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
ed26505d-3645-44b0-ace8-f10dc63b2d2c	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_view-clients}	view-clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
e14fecc6-e730-4e5b-aaf2-f6fb43faafb6	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_view-events}	view-events	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
cbb016f3-3905-474c-8f87-0d8aca5119fc	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_view-identity-providers}	view-identity-providers	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
429df475-bcad-4fcf-af8e-46a8416c0c7a	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_view-authorization}	view-authorization	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
b1249f2f-6d77-4822-ae1f-481b269d01f1	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_manage-realm}	manage-realm	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
a0364d5d-d60a-450e-b398-3a930ccc6bc2	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_manage-users}	manage-users	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
70e249e6-3a29-4f48-8499-2a3214891dab	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_manage-clients}	manage-clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
8a5d8214-c207-41be-b447-d26f305d32b8	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_manage-events}	manage-events	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
183aac14-c562-4577-bf31-a5f5ad62ea9f	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_manage-identity-providers}	manage-identity-providers	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
d564cd0f-c595-4452-89f1-603c42b7eaf7	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_manage-authorization}	manage-authorization	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
c6e84146-e645-4fab-b809-f74ca1d15178	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_query-users}	query-users	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
3a9da386-74f8-4634-891d-4cb7823b8a37	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_query-clients}	query-clients	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
f96c4752-2981-4e91-9790-efcf6107e9e0	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_query-realms}	query-realms	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
8cf8aa94-4b0c-4f31-a61f-4240d17a3100	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_query-groups}	query-groups	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
96ac96ae-ad26-41e3-a0b7-127c8f125628	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_realm-admin}	realm-admin	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
fc0e2819-7e78-45c7-adb7-7558170895ec	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_create-client}	create-client	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
d856e554-8697-46a7-bfc3-83becd03a9ae	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_view-realm}	view-realm	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
7f4555d2-adea-49a2-a14f-7e7f7385d908	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_view-users}	view-users	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
8407df30-99b4-4ed6-8fb4-da2955d8b36f	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_view-clients}	view-clients	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
7c9a53e7-1808-4457-a58d-da700466b711	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_view-events}	view-events	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
eabcb9e2-a670-4c34-b1f4-f230d3a8e6d2	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_view-identity-providers}	view-identity-providers	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
4cad04a7-5cf5-4e54-b645-d1baaa3fb998	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_view-authorization}	view-authorization	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
e76229cb-c54a-4949-b97f-081efc019e73	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_manage-realm}	manage-realm	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
1361c8d7-f97a-43ec-bb75-071fe839d3a6	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_manage-users}	manage-users	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
26490311-90d9-4d10-b46d-8ea08a9116f3	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_manage-clients}	manage-clients	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
9be7368d-b177-4d20-b638-3e653948e0fc	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_manage-events}	manage-events	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
c5d0d0e6-e1ec-4189-9b83-05cf813abb43	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_manage-identity-providers}	manage-identity-providers	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
3c331460-5a4a-4a1a-915f-860e674bdbd8	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_manage-authorization}	manage-authorization	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
19e66aae-1c8a-41fd-86b5-e24fe50d5627	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_query-users}	query-users	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
f58af06f-d7b7-47d7-b665-43c415237b03	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_query-clients}	query-clients	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
640f6f51-3841-4044-ab00-044b5b10f61c	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_query-realms}	query-realms	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
f066ad12-3926-4ad5-b8a8-41cc96fb12d8	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_query-groups}	query-groups	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
d31de509-8b75-432f-b984-b387ecfa7117	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_view-profile}	view-profile	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
a9b03f3d-77cd-4c58-be75-1ebbb955a366	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_manage-account}	manage-account	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
ccae7be7-650b-4da9-9e45-289fb5834ae2	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_manage-account-links}	manage-account-links	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
37e15b5d-c9f8-45ab-9267-4a910f842cbc	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_view-applications}	view-applications	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
91470240-8f25-449e-b3bd-f1c1289f67ba	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_view-consent}	view-consent	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
4e8744a7-2551-4625-971e-da6b0d6adc10	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_manage-consent}	manage-consent	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
d5985d55-a7e7-428b-ad3c-2a872e1badca	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_view-groups}	view-groups	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
bb4aefeb-ca8e-4779-965f-5edb3b5e94cf	b71e9c14-021e-4da0-a568-30dd6a6c7e58	t	${role_delete-account}	delete-account	39799f2c-4662-4089-918d-99875bb5d615	b71e9c14-021e-4da0-a568-30dd6a6c7e58	\N
180dac86-03d2-4b11-8fab-12cb3803d593	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	t	${role_impersonation}	impersonation	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	\N
20337722-16fa-46a3-90f8-af27e40ad5d0	7673150c-c2f3-4b70-b36a-109bb4924d43	t	${role_impersonation}	impersonation	39799f2c-4662-4089-918d-99875bb5d615	7673150c-c2f3-4b70-b36a-109bb4924d43	\N
a152740c-c8a3-4e07-8e1b-01a25b092663	2bc20571-4afb-434b-b71b-0c2394ef0970	t	${role_read-token}	read-token	39799f2c-4662-4089-918d-99875bb5d615	2bc20571-4afb-434b-b71b-0c2394ef0970	\N
85dafa71-06ae-4608-83b1-23989ec24c8b	39799f2c-4662-4089-918d-99875bb5d615	f	${role_offline-access}	offline_access	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
000c8145-2cd6-4087-9bbd-7c3f094f5c52	39799f2c-4662-4089-918d-99875bb5d615	f	\N	receptionist	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
ec304313-d5ca-447e-a0b1-6db603f24351	39799f2c-4662-4089-918d-99875bb5d615	f	\N	doctor	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
4eb371eb-e663-4e9e-a54f-99dd923612c9	39799f2c-4662-4089-918d-99875bb5d615	f	\N	nurse	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
4812120e-62a7-4b55-bbb3-142a3b4be2d6	39799f2c-4662-4089-918d-99875bb5d615	f	\N	pharmacist	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
68ed329d-98bf-40f0-b06b-ebc43d6b5340	39799f2c-4662-4089-918d-99875bb5d615	f	\N	lab_technician	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
2a7a497f-44f0-452b-ad3d-bd923f4b3853	39799f2c-4662-4089-918d-99875bb5d615	f	\N	accountant	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
32c731c8-dbbb-460d-abe4-56e887abb87a	39799f2c-4662-4089-918d-99875bb5d615	f	\N	admin_hospital	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
c0190fa7-c0f8-4bc9-a115-bcb26e73851b	39799f2c-4662-4089-918d-99875bb5d615	f	\N	admin	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	39799f2c-4662-4089-918d-99875bb5d615	f	\N	patient	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
a228bf15-089e-4313-a878-2aebf2932914	39799f2c-4662-4089-918d-99875bb5d615	f	\N	user	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
9028e844-7555-43e7-a777-bf50b177aceb	39799f2c-4662-4089-918d-99875bb5d615	f	${role_uma_authorization}	uma_authorization	39799f2c-4662-4089-918d-99875bb5d615	\N	\N
\.


--
-- Data for Name: migration_model; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.migration_model (id, version, update_time) FROM stdin;
ghlh5	23.0.0	1761947399
\.


--
-- Data for Name: offline_client_session; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.offline_client_session (user_session_id, client_id, offline_flag, "timestamp", data, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: offline_user_session; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.offline_user_session (user_session_id, user_id, realm_id, created_on, offline_flag, data, last_session_refresh) FROM stdin;
\.


--
-- Data for Name: policy_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.policy_config (policy_id, name, value) FROM stdin;
\.


--
-- Data for Name: protocol_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.protocol_mapper (id, name, protocol, protocol_mapper_name, client_id, client_scope_id) FROM stdin;
4c7bf5e8-dbc6-4267-b856-b0094cfa26f7	audience resolve	openid-connect	oidc-audience-resolve-mapper	7ea80c92-3515-4b04-aff9-7f1705afa3ed	\N
b78794d3-977b-4bf3-ba2a-386875dca163	locale	openid-connect	oidc-usermodel-attribute-mapper	40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	\N
e17de3a8-56f1-4f87-a28e-1b6b3ccfb6df	role list	saml	saml-role-list-mapper	\N	3fc2a2c7-8e2d-43d3-86e5-a954797c1069
7dfdc43e-2ab8-420d-8a78-3b26dee3938a	full name	openid-connect	oidc-full-name-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
7485eb12-aef5-49cd-a59f-a14600d2f9b2	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
a87b073d-9a74-481b-a1d4-8f89f0789f0b	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
a4052bce-a32b-4d21-9c90-88c36f0592d7	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
3a2a2a77-3d04-444c-9abe-6d428d0736b2	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
2164023a-51d4-413d-a31e-aebb19c290d1	username	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
8e349090-5225-4ea0-8f52-6f74d5f9570e	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	website	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
d4e47d02-65c4-428c-bb79-8141f7c8ad52	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
c3abfeea-1613-41be-9999-bb5f44882e40	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
68b1016c-af1a-42e1-98bd-275a7b493084	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
c5965823-c2f7-4145-be1f-ada80be4a909	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
71db1310-db73-4082-a64d-a49fc6eb4608	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	a04f93ad-ae7f-49c5-85b2-f648dc2d7c8d
77940031-ffaf-49af-b89a-09ae1fdac80a	email	openid-connect	oidc-usermodel-attribute-mapper	\N	bab05a29-9c5c-4e69-9413-0fddb2ebe402
86a4416f-9e65-4065-84cf-002c92e56651	email verified	openid-connect	oidc-usermodel-property-mapper	\N	bab05a29-9c5c-4e69-9413-0fddb2ebe402
830e4904-a08f-46ab-b256-4f7d10c2db90	address	openid-connect	oidc-address-mapper	\N	3d4f589c-f733-4181-9900-f8061e8fd29c
bb4293d0-3885-457c-b08e-147b2dc8f155	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	6ce76ede-d612-4715-93a6-179246514501
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	6ce76ede-d612-4715-93a6-179246514501
62739c82-c6b1-49f0-bb0c-ad3c4a770623	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	89829ff3-f089-4c29-a729-b750ba3d3138
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	89829ff3-f089-4c29-a729-b750ba3d3138
6b4fa86b-8464-4b85-8cd1-0c66c07a8bf5	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	89829ff3-f089-4c29-a729-b750ba3d3138
65985893-fb98-4d89-9c40-be60c9b58029	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	7980e866-3958-4e29-a615-6595735efaec
0eed1a74-439e-486b-ae83-fa68d3c3c29d	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	853bf943-afd8-4571-9892-abca3a489513
0bce0f03-ad3f-4f81-a534-71a24cf269a4	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	853bf943-afd8-4571-9892-abca3a489513
55463f83-db77-4b3c-a193-8aff28766c46	acr loa level	openid-connect	oidc-acr-mapper	\N	e6407edd-4d85-4bd0-8e87-2b82f68b06cf
287d09de-7479-421f-8225-2a6d6b0dc9be	audience resolve	openid-connect	oidc-audience-resolve-mapper	ce36e3cf-12d4-45c1-a954-af3e053acec8	\N
682bfe91-3779-43fc-b7ce-053e07f842e3	role list	saml	saml-role-list-mapper	\N	66d84b40-237a-478e-b178-1b87cd943a14
a41fcb62-23df-4107-84d4-13efe7840372	full name	openid-connect	oidc-full-name-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
fd3157f7-5ba0-42f3-858a-6cc8548702eb	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
e52f1b58-6d8d-43b3-a911-e46c827d58cd	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
0a1c19f2-3a60-48e1-9eb7-b2091226942a	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
1c342078-04fb-470a-be70-7daddf1f2ebe	username	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
48a7b354-99ee-44e4-b220-9ae2332d4100	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
537dbd57-d921-423b-9beb-4ae55840426d	website	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
b3786188-d676-4dc1-bda5-d9f47c259577	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
5cb924d3-6840-4821-9972-2c2265e01943	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
aa531b56-8076-461e-85f1-a525990a78a2	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
bef64953-e731-4579-a201-0915bd6a3d5a	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	973c248d-715b-444f-8235-efec1a8ca602
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	email	openid-connect	oidc-usermodel-attribute-mapper	\N	ffab2650-2172-4056-84d7-e5e4db9ba524
38db9d4d-bc45-45ce-9719-29977397730b	email verified	openid-connect	oidc-usermodel-property-mapper	\N	ffab2650-2172-4056-84d7-e5e4db9ba524
8413a116-6d4b-4950-8ee7-09afa514fde1	address	openid-connect	oidc-address-mapper	\N	fb732bce-d898-4f3e-994c-f7641047accd
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	42ce5674-7218-4105-b076-68ffdba861c2
92394315-2e87-4416-a5ae-af2161c15f76	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	42ce5674-7218-4105-b076-68ffdba861c2
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	91617ee0-425c-4a3b-9794-44953bf73618
22d93eba-f19c-43b0-879c-aa6bdf2acf55	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	91617ee0-425c-4a3b-9794-44953bf73618
3f5bc27e-f0b6-486b-b334-81af9cd71814	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	91617ee0-425c-4a3b-9794-44953bf73618
8d21ad71-43f5-45bd-85f1-57025db44029	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	7d9a70a7-78b3-4d4e-bcda-db69b36d64ba
07367073-e41f-4b8f-b164-65b00933b337	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	48526f32-1519-4fea-a921-dcc083551af2
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	48526f32-1519-4fea-a921-dcc083551af2
4fe3034c-a3b2-4419-9b97-0a590567bdb5	acr loa level	openid-connect	oidc-acr-mapper	\N	23e798cb-f10c-44a4-a465-473f300db2b7
f1896145-0452-44ec-83ed-d6584308ba32	realm roles to roles	openid-connect	oidc-usermodel-realm-role-mapper	86bf8a17-a4f1-4204-9cdd-572b9ca60a71	\N
24405eff-8a72-4d83-ae64-953173d5a7f2	realm roles to roles	openid-connect	oidc-usermodel-realm-role-mapper	12ee7e32-a154-4be9-ab5c-6f437c15ce71	\N
14e9a551-02e7-4710-a76d-8efb49b15151	realm roles to roles	openid-connect	oidc-usermodel-realm-role-mapper	45324d7c-9871-48eb-933d-f85d78844baf	\N
c5531ce4-67c4-419c-af37-196803ab2f5f	realm roles to roles	openid-connect	oidc-usermodel-realm-role-mapper	5d301a76-7414-41f2-b5f2-507a5a9d3bcc	\N
1e275163-69e2-40cf-9244-e1aeee39ce22	locale	openid-connect	oidc-usermodel-attribute-mapper	6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	\N
\.


--
-- Data for Name: protocol_mapper_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.protocol_mapper_config (protocol_mapper_id, value, name) FROM stdin;
b78794d3-977b-4bf3-ba2a-386875dca163	true	introspection.token.claim
b78794d3-977b-4bf3-ba2a-386875dca163	true	userinfo.token.claim
b78794d3-977b-4bf3-ba2a-386875dca163	locale	user.attribute
b78794d3-977b-4bf3-ba2a-386875dca163	true	id.token.claim
b78794d3-977b-4bf3-ba2a-386875dca163	true	access.token.claim
b78794d3-977b-4bf3-ba2a-386875dca163	locale	claim.name
b78794d3-977b-4bf3-ba2a-386875dca163	String	jsonType.label
e17de3a8-56f1-4f87-a28e-1b6b3ccfb6df	false	single
e17de3a8-56f1-4f87-a28e-1b6b3ccfb6df	Basic	attribute.nameformat
e17de3a8-56f1-4f87-a28e-1b6b3ccfb6df	Role	attribute.name
2164023a-51d4-413d-a31e-aebb19c290d1	true	introspection.token.claim
2164023a-51d4-413d-a31e-aebb19c290d1	true	userinfo.token.claim
2164023a-51d4-413d-a31e-aebb19c290d1	username	user.attribute
2164023a-51d4-413d-a31e-aebb19c290d1	true	id.token.claim
2164023a-51d4-413d-a31e-aebb19c290d1	true	access.token.claim
2164023a-51d4-413d-a31e-aebb19c290d1	preferred_username	claim.name
2164023a-51d4-413d-a31e-aebb19c290d1	String	jsonType.label
3a2a2a77-3d04-444c-9abe-6d428d0736b2	true	introspection.token.claim
3a2a2a77-3d04-444c-9abe-6d428d0736b2	true	userinfo.token.claim
3a2a2a77-3d04-444c-9abe-6d428d0736b2	nickname	user.attribute
3a2a2a77-3d04-444c-9abe-6d428d0736b2	true	id.token.claim
3a2a2a77-3d04-444c-9abe-6d428d0736b2	true	access.token.claim
3a2a2a77-3d04-444c-9abe-6d428d0736b2	nickname	claim.name
3a2a2a77-3d04-444c-9abe-6d428d0736b2	String	jsonType.label
68b1016c-af1a-42e1-98bd-275a7b493084	true	introspection.token.claim
68b1016c-af1a-42e1-98bd-275a7b493084	true	userinfo.token.claim
68b1016c-af1a-42e1-98bd-275a7b493084	zoneinfo	user.attribute
68b1016c-af1a-42e1-98bd-275a7b493084	true	id.token.claim
68b1016c-af1a-42e1-98bd-275a7b493084	true	access.token.claim
68b1016c-af1a-42e1-98bd-275a7b493084	zoneinfo	claim.name
68b1016c-af1a-42e1-98bd-275a7b493084	String	jsonType.label
71db1310-db73-4082-a64d-a49fc6eb4608	true	introspection.token.claim
71db1310-db73-4082-a64d-a49fc6eb4608	true	userinfo.token.claim
71db1310-db73-4082-a64d-a49fc6eb4608	updatedAt	user.attribute
71db1310-db73-4082-a64d-a49fc6eb4608	true	id.token.claim
71db1310-db73-4082-a64d-a49fc6eb4608	true	access.token.claim
71db1310-db73-4082-a64d-a49fc6eb4608	updated_at	claim.name
71db1310-db73-4082-a64d-a49fc6eb4608	long	jsonType.label
7485eb12-aef5-49cd-a59f-a14600d2f9b2	true	introspection.token.claim
7485eb12-aef5-49cd-a59f-a14600d2f9b2	true	userinfo.token.claim
7485eb12-aef5-49cd-a59f-a14600d2f9b2	lastName	user.attribute
7485eb12-aef5-49cd-a59f-a14600d2f9b2	true	id.token.claim
7485eb12-aef5-49cd-a59f-a14600d2f9b2	true	access.token.claim
7485eb12-aef5-49cd-a59f-a14600d2f9b2	family_name	claim.name
7485eb12-aef5-49cd-a59f-a14600d2f9b2	String	jsonType.label
7dfdc43e-2ab8-420d-8a78-3b26dee3938a	true	introspection.token.claim
7dfdc43e-2ab8-420d-8a78-3b26dee3938a	true	userinfo.token.claim
7dfdc43e-2ab8-420d-8a78-3b26dee3938a	true	id.token.claim
7dfdc43e-2ab8-420d-8a78-3b26dee3938a	true	access.token.claim
8e349090-5225-4ea0-8f52-6f74d5f9570e	true	introspection.token.claim
8e349090-5225-4ea0-8f52-6f74d5f9570e	true	userinfo.token.claim
8e349090-5225-4ea0-8f52-6f74d5f9570e	profile	user.attribute
8e349090-5225-4ea0-8f52-6f74d5f9570e	true	id.token.claim
8e349090-5225-4ea0-8f52-6f74d5f9570e	true	access.token.claim
8e349090-5225-4ea0-8f52-6f74d5f9570e	profile	claim.name
8e349090-5225-4ea0-8f52-6f74d5f9570e	String	jsonType.label
a4052bce-a32b-4d21-9c90-88c36f0592d7	true	introspection.token.claim
a4052bce-a32b-4d21-9c90-88c36f0592d7	true	userinfo.token.claim
a4052bce-a32b-4d21-9c90-88c36f0592d7	middleName	user.attribute
a4052bce-a32b-4d21-9c90-88c36f0592d7	true	id.token.claim
a4052bce-a32b-4d21-9c90-88c36f0592d7	true	access.token.claim
a4052bce-a32b-4d21-9c90-88c36f0592d7	middle_name	claim.name
a4052bce-a32b-4d21-9c90-88c36f0592d7	String	jsonType.label
a87b073d-9a74-481b-a1d4-8f89f0789f0b	true	introspection.token.claim
a87b073d-9a74-481b-a1d4-8f89f0789f0b	true	userinfo.token.claim
a87b073d-9a74-481b-a1d4-8f89f0789f0b	firstName	user.attribute
a87b073d-9a74-481b-a1d4-8f89f0789f0b	true	id.token.claim
a87b073d-9a74-481b-a1d4-8f89f0789f0b	true	access.token.claim
a87b073d-9a74-481b-a1d4-8f89f0789f0b	given_name	claim.name
a87b073d-9a74-481b-a1d4-8f89f0789f0b	String	jsonType.label
c3abfeea-1613-41be-9999-bb5f44882e40	true	introspection.token.claim
c3abfeea-1613-41be-9999-bb5f44882e40	true	userinfo.token.claim
c3abfeea-1613-41be-9999-bb5f44882e40	birthdate	user.attribute
c3abfeea-1613-41be-9999-bb5f44882e40	true	id.token.claim
c3abfeea-1613-41be-9999-bb5f44882e40	true	access.token.claim
c3abfeea-1613-41be-9999-bb5f44882e40	birthdate	claim.name
c3abfeea-1613-41be-9999-bb5f44882e40	String	jsonType.label
c5965823-c2f7-4145-be1f-ada80be4a909	true	introspection.token.claim
c5965823-c2f7-4145-be1f-ada80be4a909	true	userinfo.token.claim
c5965823-c2f7-4145-be1f-ada80be4a909	locale	user.attribute
c5965823-c2f7-4145-be1f-ada80be4a909	true	id.token.claim
c5965823-c2f7-4145-be1f-ada80be4a909	true	access.token.claim
c5965823-c2f7-4145-be1f-ada80be4a909	locale	claim.name
c5965823-c2f7-4145-be1f-ada80be4a909	String	jsonType.label
d4e47d02-65c4-428c-bb79-8141f7c8ad52	true	introspection.token.claim
d4e47d02-65c4-428c-bb79-8141f7c8ad52	true	userinfo.token.claim
d4e47d02-65c4-428c-bb79-8141f7c8ad52	gender	user.attribute
d4e47d02-65c4-428c-bb79-8141f7c8ad52	true	id.token.claim
d4e47d02-65c4-428c-bb79-8141f7c8ad52	true	access.token.claim
d4e47d02-65c4-428c-bb79-8141f7c8ad52	gender	claim.name
d4e47d02-65c4-428c-bb79-8141f7c8ad52	String	jsonType.label
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	true	introspection.token.claim
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	true	userinfo.token.claim
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	website	user.attribute
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	true	id.token.claim
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	true	access.token.claim
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	website	claim.name
e9b80aa8-7c6b-41ce-8dd5-db69f49bf8c6	String	jsonType.label
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	true	introspection.token.claim
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	true	userinfo.token.claim
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	picture	user.attribute
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	true	id.token.claim
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	true	access.token.claim
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	picture	claim.name
fe9cb3ba-74be-4782-8daa-fdf9f05f72ef	String	jsonType.label
77940031-ffaf-49af-b89a-09ae1fdac80a	true	introspection.token.claim
77940031-ffaf-49af-b89a-09ae1fdac80a	true	userinfo.token.claim
77940031-ffaf-49af-b89a-09ae1fdac80a	email	user.attribute
77940031-ffaf-49af-b89a-09ae1fdac80a	true	id.token.claim
77940031-ffaf-49af-b89a-09ae1fdac80a	true	access.token.claim
77940031-ffaf-49af-b89a-09ae1fdac80a	email	claim.name
77940031-ffaf-49af-b89a-09ae1fdac80a	String	jsonType.label
86a4416f-9e65-4065-84cf-002c92e56651	true	introspection.token.claim
86a4416f-9e65-4065-84cf-002c92e56651	true	userinfo.token.claim
86a4416f-9e65-4065-84cf-002c92e56651	emailVerified	user.attribute
86a4416f-9e65-4065-84cf-002c92e56651	true	id.token.claim
86a4416f-9e65-4065-84cf-002c92e56651	true	access.token.claim
86a4416f-9e65-4065-84cf-002c92e56651	email_verified	claim.name
86a4416f-9e65-4065-84cf-002c92e56651	boolean	jsonType.label
830e4904-a08f-46ab-b256-4f7d10c2db90	formatted	user.attribute.formatted
830e4904-a08f-46ab-b256-4f7d10c2db90	country	user.attribute.country
830e4904-a08f-46ab-b256-4f7d10c2db90	true	introspection.token.claim
830e4904-a08f-46ab-b256-4f7d10c2db90	postal_code	user.attribute.postal_code
830e4904-a08f-46ab-b256-4f7d10c2db90	true	userinfo.token.claim
830e4904-a08f-46ab-b256-4f7d10c2db90	street	user.attribute.street
830e4904-a08f-46ab-b256-4f7d10c2db90	true	id.token.claim
830e4904-a08f-46ab-b256-4f7d10c2db90	region	user.attribute.region
830e4904-a08f-46ab-b256-4f7d10c2db90	true	access.token.claim
830e4904-a08f-46ab-b256-4f7d10c2db90	locality	user.attribute.locality
bb4293d0-3885-457c-b08e-147b2dc8f155	true	introspection.token.claim
bb4293d0-3885-457c-b08e-147b2dc8f155	true	userinfo.token.claim
bb4293d0-3885-457c-b08e-147b2dc8f155	phoneNumber	user.attribute
bb4293d0-3885-457c-b08e-147b2dc8f155	true	id.token.claim
bb4293d0-3885-457c-b08e-147b2dc8f155	true	access.token.claim
bb4293d0-3885-457c-b08e-147b2dc8f155	phone_number	claim.name
bb4293d0-3885-457c-b08e-147b2dc8f155	String	jsonType.label
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	true	introspection.token.claim
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	true	userinfo.token.claim
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	phoneNumberVerified	user.attribute
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	true	id.token.claim
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	true	access.token.claim
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	phone_number_verified	claim.name
c3110f4a-ed58-42b1-9e0b-c1c296c4b7d4	boolean	jsonType.label
62739c82-c6b1-49f0-bb0c-ad3c4a770623	true	introspection.token.claim
62739c82-c6b1-49f0-bb0c-ad3c4a770623	true	multivalued
62739c82-c6b1-49f0-bb0c-ad3c4a770623	foo	user.attribute
62739c82-c6b1-49f0-bb0c-ad3c4a770623	true	access.token.claim
62739c82-c6b1-49f0-bb0c-ad3c4a770623	realm_access.roles	claim.name
62739c82-c6b1-49f0-bb0c-ad3c4a770623	String	jsonType.label
6b4fa86b-8464-4b85-8cd1-0c66c07a8bf5	true	introspection.token.claim
6b4fa86b-8464-4b85-8cd1-0c66c07a8bf5	true	access.token.claim
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	true	introspection.token.claim
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	true	multivalued
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	foo	user.attribute
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	true	access.token.claim
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	resource_access.${client_id}.roles	claim.name
cb1b0993-3305-46a2-9fa1-28ff0fb2b72f	String	jsonType.label
65985893-fb98-4d89-9c40-be60c9b58029	true	introspection.token.claim
65985893-fb98-4d89-9c40-be60c9b58029	true	access.token.claim
0bce0f03-ad3f-4f81-a534-71a24cf269a4	true	introspection.token.claim
0bce0f03-ad3f-4f81-a534-71a24cf269a4	true	multivalued
0bce0f03-ad3f-4f81-a534-71a24cf269a4	foo	user.attribute
0bce0f03-ad3f-4f81-a534-71a24cf269a4	true	id.token.claim
0bce0f03-ad3f-4f81-a534-71a24cf269a4	true	access.token.claim
0bce0f03-ad3f-4f81-a534-71a24cf269a4	groups	claim.name
0bce0f03-ad3f-4f81-a534-71a24cf269a4	String	jsonType.label
0eed1a74-439e-486b-ae83-fa68d3c3c29d	true	introspection.token.claim
0eed1a74-439e-486b-ae83-fa68d3c3c29d	true	userinfo.token.claim
0eed1a74-439e-486b-ae83-fa68d3c3c29d	username	user.attribute
0eed1a74-439e-486b-ae83-fa68d3c3c29d	true	id.token.claim
0eed1a74-439e-486b-ae83-fa68d3c3c29d	true	access.token.claim
0eed1a74-439e-486b-ae83-fa68d3c3c29d	upn	claim.name
0eed1a74-439e-486b-ae83-fa68d3c3c29d	String	jsonType.label
55463f83-db77-4b3c-a193-8aff28766c46	true	introspection.token.claim
55463f83-db77-4b3c-a193-8aff28766c46	true	id.token.claim
55463f83-db77-4b3c-a193-8aff28766c46	true	access.token.claim
682bfe91-3779-43fc-b7ce-053e07f842e3	false	single
682bfe91-3779-43fc-b7ce-053e07f842e3	Basic	attribute.nameformat
682bfe91-3779-43fc-b7ce-053e07f842e3	Role	attribute.name
0a1c19f2-3a60-48e1-9eb7-b2091226942a	true	introspection.token.claim
0a1c19f2-3a60-48e1-9eb7-b2091226942a	true	userinfo.token.claim
0a1c19f2-3a60-48e1-9eb7-b2091226942a	middleName	user.attribute
0a1c19f2-3a60-48e1-9eb7-b2091226942a	true	id.token.claim
0a1c19f2-3a60-48e1-9eb7-b2091226942a	true	access.token.claim
0a1c19f2-3a60-48e1-9eb7-b2091226942a	middle_name	claim.name
0a1c19f2-3a60-48e1-9eb7-b2091226942a	String	jsonType.label
1c342078-04fb-470a-be70-7daddf1f2ebe	true	introspection.token.claim
1c342078-04fb-470a-be70-7daddf1f2ebe	true	userinfo.token.claim
1c342078-04fb-470a-be70-7daddf1f2ebe	username	user.attribute
1c342078-04fb-470a-be70-7daddf1f2ebe	true	id.token.claim
1c342078-04fb-470a-be70-7daddf1f2ebe	true	access.token.claim
1c342078-04fb-470a-be70-7daddf1f2ebe	preferred_username	claim.name
1c342078-04fb-470a-be70-7daddf1f2ebe	String	jsonType.label
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	true	introspection.token.claim
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	true	userinfo.token.claim
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	nickname	user.attribute
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	true	id.token.claim
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	true	access.token.claim
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	nickname	claim.name
204b7e8a-5c56-41cf-b6dc-bbf2711ceab8	String	jsonType.label
48a7b354-99ee-44e4-b220-9ae2332d4100	true	introspection.token.claim
48a7b354-99ee-44e4-b220-9ae2332d4100	true	userinfo.token.claim
48a7b354-99ee-44e4-b220-9ae2332d4100	picture	user.attribute
48a7b354-99ee-44e4-b220-9ae2332d4100	true	id.token.claim
48a7b354-99ee-44e4-b220-9ae2332d4100	true	access.token.claim
48a7b354-99ee-44e4-b220-9ae2332d4100	picture	claim.name
48a7b354-99ee-44e4-b220-9ae2332d4100	String	jsonType.label
537dbd57-d921-423b-9beb-4ae55840426d	true	introspection.token.claim
537dbd57-d921-423b-9beb-4ae55840426d	true	userinfo.token.claim
537dbd57-d921-423b-9beb-4ae55840426d	website	user.attribute
537dbd57-d921-423b-9beb-4ae55840426d	true	id.token.claim
537dbd57-d921-423b-9beb-4ae55840426d	true	access.token.claim
537dbd57-d921-423b-9beb-4ae55840426d	website	claim.name
537dbd57-d921-423b-9beb-4ae55840426d	String	jsonType.label
5cb924d3-6840-4821-9972-2c2265e01943	true	introspection.token.claim
5cb924d3-6840-4821-9972-2c2265e01943	true	userinfo.token.claim
5cb924d3-6840-4821-9972-2c2265e01943	birthdate	user.attribute
5cb924d3-6840-4821-9972-2c2265e01943	true	id.token.claim
5cb924d3-6840-4821-9972-2c2265e01943	true	access.token.claim
5cb924d3-6840-4821-9972-2c2265e01943	birthdate	claim.name
5cb924d3-6840-4821-9972-2c2265e01943	String	jsonType.label
a41fcb62-23df-4107-84d4-13efe7840372	true	introspection.token.claim
a41fcb62-23df-4107-84d4-13efe7840372	true	userinfo.token.claim
a41fcb62-23df-4107-84d4-13efe7840372	true	id.token.claim
a41fcb62-23df-4107-84d4-13efe7840372	true	access.token.claim
aa531b56-8076-461e-85f1-a525990a78a2	true	introspection.token.claim
aa531b56-8076-461e-85f1-a525990a78a2	true	userinfo.token.claim
aa531b56-8076-461e-85f1-a525990a78a2	zoneinfo	user.attribute
aa531b56-8076-461e-85f1-a525990a78a2	true	id.token.claim
aa531b56-8076-461e-85f1-a525990a78a2	true	access.token.claim
aa531b56-8076-461e-85f1-a525990a78a2	zoneinfo	claim.name
aa531b56-8076-461e-85f1-a525990a78a2	String	jsonType.label
b3786188-d676-4dc1-bda5-d9f47c259577	true	introspection.token.claim
b3786188-d676-4dc1-bda5-d9f47c259577	true	userinfo.token.claim
b3786188-d676-4dc1-bda5-d9f47c259577	gender	user.attribute
b3786188-d676-4dc1-bda5-d9f47c259577	true	id.token.claim
b3786188-d676-4dc1-bda5-d9f47c259577	true	access.token.claim
b3786188-d676-4dc1-bda5-d9f47c259577	gender	claim.name
b3786188-d676-4dc1-bda5-d9f47c259577	String	jsonType.label
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	true	introspection.token.claim
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	true	userinfo.token.claim
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	locale	user.attribute
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	true	id.token.claim
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	true	access.token.claim
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	locale	claim.name
bebe0bb9-73cb-48bd-aaea-e4caf7d81004	String	jsonType.label
bef64953-e731-4579-a201-0915bd6a3d5a	true	introspection.token.claim
bef64953-e731-4579-a201-0915bd6a3d5a	true	userinfo.token.claim
bef64953-e731-4579-a201-0915bd6a3d5a	updatedAt	user.attribute
bef64953-e731-4579-a201-0915bd6a3d5a	true	id.token.claim
bef64953-e731-4579-a201-0915bd6a3d5a	true	access.token.claim
bef64953-e731-4579-a201-0915bd6a3d5a	updated_at	claim.name
bef64953-e731-4579-a201-0915bd6a3d5a	long	jsonType.label
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	true	introspection.token.claim
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	true	userinfo.token.claim
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	profile	user.attribute
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	true	id.token.claim
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	true	access.token.claim
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	profile	claim.name
d4dcbce9-aeb1-4de5-9a99-a5eabc9e4aa4	String	jsonType.label
e52f1b58-6d8d-43b3-a911-e46c827d58cd	true	introspection.token.claim
e52f1b58-6d8d-43b3-a911-e46c827d58cd	true	userinfo.token.claim
e52f1b58-6d8d-43b3-a911-e46c827d58cd	firstName	user.attribute
e52f1b58-6d8d-43b3-a911-e46c827d58cd	true	id.token.claim
e52f1b58-6d8d-43b3-a911-e46c827d58cd	true	access.token.claim
e52f1b58-6d8d-43b3-a911-e46c827d58cd	given_name	claim.name
e52f1b58-6d8d-43b3-a911-e46c827d58cd	String	jsonType.label
fd3157f7-5ba0-42f3-858a-6cc8548702eb	true	introspection.token.claim
fd3157f7-5ba0-42f3-858a-6cc8548702eb	true	userinfo.token.claim
fd3157f7-5ba0-42f3-858a-6cc8548702eb	lastName	user.attribute
fd3157f7-5ba0-42f3-858a-6cc8548702eb	true	id.token.claim
fd3157f7-5ba0-42f3-858a-6cc8548702eb	true	access.token.claim
fd3157f7-5ba0-42f3-858a-6cc8548702eb	family_name	claim.name
fd3157f7-5ba0-42f3-858a-6cc8548702eb	String	jsonType.label
38db9d4d-bc45-45ce-9719-29977397730b	true	introspection.token.claim
38db9d4d-bc45-45ce-9719-29977397730b	true	userinfo.token.claim
38db9d4d-bc45-45ce-9719-29977397730b	emailVerified	user.attribute
38db9d4d-bc45-45ce-9719-29977397730b	true	id.token.claim
38db9d4d-bc45-45ce-9719-29977397730b	true	access.token.claim
38db9d4d-bc45-45ce-9719-29977397730b	email_verified	claim.name
38db9d4d-bc45-45ce-9719-29977397730b	boolean	jsonType.label
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	true	introspection.token.claim
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	true	userinfo.token.claim
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	email	user.attribute
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	true	id.token.claim
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	true	access.token.claim
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	email	claim.name
a67b61d5-dcd5-4917-bf38-cf7e7b6bc692	String	jsonType.label
8413a116-6d4b-4950-8ee7-09afa514fde1	formatted	user.attribute.formatted
8413a116-6d4b-4950-8ee7-09afa514fde1	country	user.attribute.country
8413a116-6d4b-4950-8ee7-09afa514fde1	true	introspection.token.claim
8413a116-6d4b-4950-8ee7-09afa514fde1	postal_code	user.attribute.postal_code
8413a116-6d4b-4950-8ee7-09afa514fde1	true	userinfo.token.claim
8413a116-6d4b-4950-8ee7-09afa514fde1	street	user.attribute.street
8413a116-6d4b-4950-8ee7-09afa514fde1	true	id.token.claim
8413a116-6d4b-4950-8ee7-09afa514fde1	region	user.attribute.region
8413a116-6d4b-4950-8ee7-09afa514fde1	true	access.token.claim
8413a116-6d4b-4950-8ee7-09afa514fde1	locality	user.attribute.locality
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	true	introspection.token.claim
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	true	userinfo.token.claim
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	phoneNumber	user.attribute
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	true	id.token.claim
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	true	access.token.claim
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	phone_number	claim.name
8e6138d3-3ccd-4f01-8664-cf8d36c173e8	String	jsonType.label
92394315-2e87-4416-a5ae-af2161c15f76	true	introspection.token.claim
92394315-2e87-4416-a5ae-af2161c15f76	true	userinfo.token.claim
92394315-2e87-4416-a5ae-af2161c15f76	phoneNumberVerified	user.attribute
92394315-2e87-4416-a5ae-af2161c15f76	true	id.token.claim
92394315-2e87-4416-a5ae-af2161c15f76	true	access.token.claim
92394315-2e87-4416-a5ae-af2161c15f76	phone_number_verified	claim.name
92394315-2e87-4416-a5ae-af2161c15f76	boolean	jsonType.label
22d93eba-f19c-43b0-879c-aa6bdf2acf55	true	introspection.token.claim
22d93eba-f19c-43b0-879c-aa6bdf2acf55	true	multivalued
22d93eba-f19c-43b0-879c-aa6bdf2acf55	foo	user.attribute
22d93eba-f19c-43b0-879c-aa6bdf2acf55	true	access.token.claim
22d93eba-f19c-43b0-879c-aa6bdf2acf55	resource_access.${client_id}.roles	claim.name
22d93eba-f19c-43b0-879c-aa6bdf2acf55	String	jsonType.label
3f5bc27e-f0b6-486b-b334-81af9cd71814	true	introspection.token.claim
3f5bc27e-f0b6-486b-b334-81af9cd71814	true	access.token.claim
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	true	introspection.token.claim
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	true	multivalued
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	foo	user.attribute
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	true	access.token.claim
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	realm_access.roles	claim.name
4b4933d8-6dda-4a98-a1d7-a2976442a7c5	String	jsonType.label
8d21ad71-43f5-45bd-85f1-57025db44029	true	introspection.token.claim
8d21ad71-43f5-45bd-85f1-57025db44029	true	access.token.claim
07367073-e41f-4b8f-b164-65b00933b337	true	introspection.token.claim
07367073-e41f-4b8f-b164-65b00933b337	true	userinfo.token.claim
07367073-e41f-4b8f-b164-65b00933b337	username	user.attribute
07367073-e41f-4b8f-b164-65b00933b337	true	id.token.claim
07367073-e41f-4b8f-b164-65b00933b337	true	access.token.claim
07367073-e41f-4b8f-b164-65b00933b337	upn	claim.name
07367073-e41f-4b8f-b164-65b00933b337	String	jsonType.label
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	true	introspection.token.claim
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	true	multivalued
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	foo	user.attribute
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	true	id.token.claim
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	true	access.token.claim
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	groups	claim.name
2a6968d5-dcc4-46a5-b65e-3fe25c28f04d	String	jsonType.label
4fe3034c-a3b2-4419-9b97-0a590567bdb5	true	introspection.token.claim
4fe3034c-a3b2-4419-9b97-0a590567bdb5	true	id.token.claim
4fe3034c-a3b2-4419-9b97-0a590567bdb5	true	access.token.claim
f1896145-0452-44ec-83ed-d6584308ba32	true	multivalued
f1896145-0452-44ec-83ed-d6584308ba32	true	userinfo.token.claim
f1896145-0452-44ec-83ed-d6584308ba32	true	id.token.claim
f1896145-0452-44ec-83ed-d6584308ba32	true	access.token.claim
f1896145-0452-44ec-83ed-d6584308ba32	roles	claim.name
f1896145-0452-44ec-83ed-d6584308ba32	String	jsonType.label
24405eff-8a72-4d83-ae64-953173d5a7f2	true	multivalued
24405eff-8a72-4d83-ae64-953173d5a7f2	true	userinfo.token.claim
24405eff-8a72-4d83-ae64-953173d5a7f2	true	id.token.claim
24405eff-8a72-4d83-ae64-953173d5a7f2	true	access.token.claim
24405eff-8a72-4d83-ae64-953173d5a7f2	roles	claim.name
24405eff-8a72-4d83-ae64-953173d5a7f2	String	jsonType.label
14e9a551-02e7-4710-a76d-8efb49b15151	true	multivalued
14e9a551-02e7-4710-a76d-8efb49b15151	true	userinfo.token.claim
14e9a551-02e7-4710-a76d-8efb49b15151	true	id.token.claim
14e9a551-02e7-4710-a76d-8efb49b15151	true	access.token.claim
14e9a551-02e7-4710-a76d-8efb49b15151	roles	claim.name
14e9a551-02e7-4710-a76d-8efb49b15151	String	jsonType.label
c5531ce4-67c4-419c-af37-196803ab2f5f	true	multivalued
c5531ce4-67c4-419c-af37-196803ab2f5f	true	userinfo.token.claim
c5531ce4-67c4-419c-af37-196803ab2f5f	true	id.token.claim
c5531ce4-67c4-419c-af37-196803ab2f5f	true	access.token.claim
c5531ce4-67c4-419c-af37-196803ab2f5f	roles	claim.name
c5531ce4-67c4-419c-af37-196803ab2f5f	String	jsonType.label
1e275163-69e2-40cf-9244-e1aeee39ce22	true	introspection.token.claim
1e275163-69e2-40cf-9244-e1aeee39ce22	true	userinfo.token.claim
1e275163-69e2-40cf-9244-e1aeee39ce22	locale	user.attribute
1e275163-69e2-40cf-9244-e1aeee39ce22	true	id.token.claim
1e275163-69e2-40cf-9244-e1aeee39ce22	true	access.token.claim
1e275163-69e2-40cf-9244-e1aeee39ce22	locale	claim.name
1e275163-69e2-40cf-9244-e1aeee39ce22	String	jsonType.label
\.


--
-- Data for Name: realm; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm (id, access_code_lifespan, user_action_lifespan, access_token_lifespan, account_theme, admin_theme, email_theme, enabled, events_enabled, events_expiration, login_theme, name, not_before, password_policy, registration_allowed, remember_me, reset_password_allowed, social, ssl_required, sso_idle_timeout, sso_max_lifespan, update_profile_on_soc_login, verify_email, master_admin_client, login_lifespan, internationalization_enabled, default_locale, reg_email_as_username, admin_events_enabled, admin_events_details_enabled, edit_username_allowed, otp_policy_counter, otp_policy_window, otp_policy_period, otp_policy_digits, otp_policy_alg, otp_policy_type, browser_flow, registration_flow, direct_grant_flow, reset_credentials_flow, client_auth_flow, offline_session_idle_timeout, revoke_refresh_token, access_token_life_implicit, login_with_email_allowed, duplicate_emails_allowed, docker_auth_flow, refresh_token_max_reuse, allow_user_managed_access, sso_max_lifespan_remember_me, sso_idle_timeout_remember_me, default_role) FROM stdin;
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	60	300	60	\N	\N	\N	t	f	0	\N	master	0	\N	f	f	f	f	EXTERNAL	1800	36000	f	f	e952156e-f82e-4d72-bc50-8814ff85661f	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	7fe234ba-d9e7-4b41-9511-45331ff663d1	86418ba0-1724-4c71-bb4e-552ee9d261b4	9826ac06-9181-4a8e-9cc9-803a5bcb24e1	62cdea4e-8f0e-40a0-83f3-4bb8b86385ba	97f4ef24-5c21-4d64-8463-5cb4422548cd	2592000	f	900	t	f	66d74419-fb33-4573-a12f-59e460338ceb	0	f	0	0	b3607f0d-6e82-401c-9b8c-416cbbaa811c
39799f2c-4662-4089-918d-99875bb5d615	60	300	300	\N	\N	\N	t	f	0	\N	ClinicRealm	0	\N	f	f	f	f	EXTERNAL	1800	36000	f	f	f3f6ff2f-2ce5-46da-b8a2-8cf935486017	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	90ebf45b-3c5c-4469-8625-859215281b41	131d9af7-e015-4dfa-a39c-89a3b7870e9c	28251dec-7cd3-4e9c-a986-d9a83c93a9ac	47730fd5-8d4a-4cdc-87a5-d5e5d9f4c03e	d4fc8665-afbb-44a1-badc-9a6d146bea95	2592000	f	900	t	f	71c80d17-82cc-4f72-9c4a-a96f7dd52e56	0	f	0	0	9fdf86cb-8348-49f2-9423-d5ab895a17d0
\.


--
-- Data for Name: realm_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_attribute (name, realm_id, value) FROM stdin;
_browser_header.contentSecurityPolicyReportOnly	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	
_browser_header.xContentTypeOptions	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	nosniff
_browser_header.referrerPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	no-referrer
_browser_header.xRobotsTag	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	none
_browser_header.xFrameOptions	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	SAMEORIGIN
_browser_header.contentSecurityPolicy	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	1; mode=block
_browser_header.strictTransportSecurity	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	max-age=31536000; includeSubDomains
bruteForceProtected	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	false
permanentLockout	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	false
maxFailureWaitSeconds	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	900
minimumQuickLoginWaitSeconds	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	60
waitIncrementSeconds	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	60
quickLoginCheckMilliSeconds	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	1000
maxDeltaTimeSeconds	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	43200
failureFactor	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	30
realmReusableOtpCode	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	false
displayName	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	Keycloak
displayNameHtml	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	<div class="kc-logo-text"><span>Keycloak</span></div>
defaultSignatureAlgorithm	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	RS256
offlineSessionMaxLifespanEnabled	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	false
offlineSessionMaxLifespan	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	5184000
_browser_header.contentSecurityPolicyReportOnly	39799f2c-4662-4089-918d-99875bb5d615	
_browser_header.xContentTypeOptions	39799f2c-4662-4089-918d-99875bb5d615	nosniff
_browser_header.referrerPolicy	39799f2c-4662-4089-918d-99875bb5d615	no-referrer
_browser_header.xRobotsTag	39799f2c-4662-4089-918d-99875bb5d615	none
_browser_header.xFrameOptions	39799f2c-4662-4089-918d-99875bb5d615	SAMEORIGIN
_browser_header.contentSecurityPolicy	39799f2c-4662-4089-918d-99875bb5d615	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	39799f2c-4662-4089-918d-99875bb5d615	1; mode=block
_browser_header.strictTransportSecurity	39799f2c-4662-4089-918d-99875bb5d615	max-age=31536000; includeSubDomains
bruteForceProtected	39799f2c-4662-4089-918d-99875bb5d615	false
permanentLockout	39799f2c-4662-4089-918d-99875bb5d615	false
maxFailureWaitSeconds	39799f2c-4662-4089-918d-99875bb5d615	900
minimumQuickLoginWaitSeconds	39799f2c-4662-4089-918d-99875bb5d615	60
waitIncrementSeconds	39799f2c-4662-4089-918d-99875bb5d615	60
quickLoginCheckMilliSeconds	39799f2c-4662-4089-918d-99875bb5d615	1000
maxDeltaTimeSeconds	39799f2c-4662-4089-918d-99875bb5d615	43200
failureFactor	39799f2c-4662-4089-918d-99875bb5d615	30
realmReusableOtpCode	39799f2c-4662-4089-918d-99875bb5d615	false
displayName	39799f2c-4662-4089-918d-99875bb5d615	Clinic Realm
defaultSignatureAlgorithm	39799f2c-4662-4089-918d-99875bb5d615	RS256
offlineSessionMaxLifespanEnabled	39799f2c-4662-4089-918d-99875bb5d615	false
offlineSessionMaxLifespan	39799f2c-4662-4089-918d-99875bb5d615	5184000
actionTokenGeneratedByAdminLifespan	39799f2c-4662-4089-918d-99875bb5d615	43200
actionTokenGeneratedByUserLifespan	39799f2c-4662-4089-918d-99875bb5d615	300
oauth2DeviceCodeLifespan	39799f2c-4662-4089-918d-99875bb5d615	600
oauth2DevicePollingInterval	39799f2c-4662-4089-918d-99875bb5d615	5
webAuthnPolicyRpEntityName	39799f2c-4662-4089-918d-99875bb5d615	keycloak
webAuthnPolicySignatureAlgorithms	39799f2c-4662-4089-918d-99875bb5d615	ES256
webAuthnPolicyRpId	39799f2c-4662-4089-918d-99875bb5d615	
webAuthnPolicyAttestationConveyancePreference	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyAuthenticatorAttachment	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyRequireResidentKey	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyUserVerificationRequirement	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyCreateTimeout	39799f2c-4662-4089-918d-99875bb5d615	0
webAuthnPolicyAvoidSameAuthenticatorRegister	39799f2c-4662-4089-918d-99875bb5d615	false
webAuthnPolicyRpEntityNamePasswordless	39799f2c-4662-4089-918d-99875bb5d615	keycloak
webAuthnPolicySignatureAlgorithmsPasswordless	39799f2c-4662-4089-918d-99875bb5d615	ES256
webAuthnPolicyRpIdPasswordless	39799f2c-4662-4089-918d-99875bb5d615	
webAuthnPolicyAttestationConveyancePreferencePasswordless	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyAuthenticatorAttachmentPasswordless	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyRequireResidentKeyPasswordless	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyUserVerificationRequirementPasswordless	39799f2c-4662-4089-918d-99875bb5d615	not specified
webAuthnPolicyCreateTimeoutPasswordless	39799f2c-4662-4089-918d-99875bb5d615	0
webAuthnPolicyAvoidSameAuthenticatorRegisterPasswordless	39799f2c-4662-4089-918d-99875bb5d615	false
cibaBackchannelTokenDeliveryMode	39799f2c-4662-4089-918d-99875bb5d615	poll
cibaExpiresIn	39799f2c-4662-4089-918d-99875bb5d615	120
cibaInterval	39799f2c-4662-4089-918d-99875bb5d615	5
cibaAuthRequestedUserHint	39799f2c-4662-4089-918d-99875bb5d615	login_hint
parRequestUriLifespan	39799f2c-4662-4089-918d-99875bb5d615	60
\.


--
-- Data for Name: realm_default_groups; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_default_groups (realm_id, group_id) FROM stdin;
\.


--
-- Data for Name: realm_enabled_event_types; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_enabled_event_types (realm_id, value) FROM stdin;
\.


--
-- Data for Name: realm_events_listeners; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_events_listeners (realm_id, value) FROM stdin;
c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	jboss-logging
39799f2c-4662-4089-918d-99875bb5d615	jboss-logging
\.


--
-- Data for Name: realm_localizations; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_localizations (realm_id, locale, texts) FROM stdin;
\.


--
-- Data for Name: realm_required_credential; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_required_credential (type, form_label, input, secret, realm_id) FROM stdin;
password	password	t	t	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495
password	password	t	t	39799f2c-4662-4089-918d-99875bb5d615
\.


--
-- Data for Name: realm_smtp_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_smtp_config (realm_id, value, name) FROM stdin;
\.


--
-- Data for Name: realm_supported_locales; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_supported_locales (realm_id, value) FROM stdin;
\.


--
-- Data for Name: redirect_uris; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.redirect_uris (client_id, value) FROM stdin;
e047e211-4b1f-48d9-8e30-1cd8ff641961	/realms/master/account/*
7ea80c92-3515-4b04-aff9-7f1705afa3ed	/realms/master/account/*
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	/admin/master/console/*
b71e9c14-021e-4da0-a568-30dd6a6c7e58	/realms/ClinicRealm/account/*
ce36e3cf-12d4-45c1-a954-af3e053acec8	/realms/ClinicRealm/account/*
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	/admin/ClinicRealm/console/*
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost:3000/callback
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost:3000/*
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost:3000/
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost:3000
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost:3000/login
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost:3001/login
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost:3001/
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost:3001/*
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost:3001
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost:3001/callback
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost:3002/callback
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost:3002
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost:3002/
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost:3002/*
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost:3002/login
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	http://localhost:8082/*
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	http://localhost:8082
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	http://localhost:8082/
\.


--
-- Data for Name: required_action_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.required_action_config (required_action_id, value, name) FROM stdin;
\.


--
-- Data for Name: required_action_provider; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.required_action_provider (id, alias, name, realm_id, enabled, default_action, provider_id, priority) FROM stdin;
c8131e4e-cb02-4078-8d8f-5868077e729d	VERIFY_EMAIL	Verify Email	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	VERIFY_EMAIL	50
9e03760a-a87a-483f-a35c-748479deb91e	UPDATE_PROFILE	Update Profile	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	UPDATE_PROFILE	40
0ebf1fd2-5814-40ba-8ca9-6e39d7221ddb	CONFIGURE_TOTP	Configure OTP	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	CONFIGURE_TOTP	10
c8dd3255-d0cf-43b8-a078-693424ee49ce	UPDATE_PASSWORD	Update Password	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	UPDATE_PASSWORD	30
f7f74ccb-cc51-4f1c-898b-3156f80c929b	TERMS_AND_CONDITIONS	Terms and Conditions	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	f	TERMS_AND_CONDITIONS	20
2061141b-04bb-47b3-9b6d-ffbc368bf98a	delete_account	Delete Account	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	f	f	delete_account	60
b26d64c9-a394-4fd9-bd20-f4b66c5ca374	update_user_locale	Update User Locale	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	update_user_locale	1000
a5da4f77-6db9-4c98-ab16-10f31df6f766	webauthn-register	Webauthn Register	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	webauthn-register	70
196bce43-cf39-4b73-bbf5-cfcf0554ff5b	webauthn-register-passwordless	Webauthn Register Passwordless	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	t	f	webauthn-register-passwordless	80
64cb7d4e-c928-4e8f-a32e-75c634b0d2fb	VERIFY_EMAIL	Verify Email	39799f2c-4662-4089-918d-99875bb5d615	t	f	VERIFY_EMAIL	50
f6b9b8cc-fc61-4f37-8a31-71a6df7c9fbb	UPDATE_PROFILE	Update Profile	39799f2c-4662-4089-918d-99875bb5d615	t	f	UPDATE_PROFILE	40
44ec5b4d-05fa-4ae9-9304-b9b495d97e6c	CONFIGURE_TOTP	Configure OTP	39799f2c-4662-4089-918d-99875bb5d615	t	f	CONFIGURE_TOTP	10
c88ee8b1-f6e3-4191-8021-dbf09797adc8	UPDATE_PASSWORD	Update Password	39799f2c-4662-4089-918d-99875bb5d615	t	f	UPDATE_PASSWORD	30
1200f655-9091-46fe-b7db-a4f47587652e	TERMS_AND_CONDITIONS	Terms and Conditions	39799f2c-4662-4089-918d-99875bb5d615	f	f	TERMS_AND_CONDITIONS	20
bb3b2c10-c6ea-4e5a-92cf-c361aa86b88e	delete_account	Delete Account	39799f2c-4662-4089-918d-99875bb5d615	f	f	delete_account	60
e33fc0ba-718b-4bf6-b6df-a55165693d00	update_user_locale	Update User Locale	39799f2c-4662-4089-918d-99875bb5d615	t	f	update_user_locale	1000
b032d26f-ca25-44d4-b195-08ab7e5361a3	webauthn-register	Webauthn Register	39799f2c-4662-4089-918d-99875bb5d615	t	f	webauthn-register	70
1053b0d1-83f5-4db7-aa29-2c57e77e9398	webauthn-register-passwordless	Webauthn Register Passwordless	39799f2c-4662-4089-918d-99875bb5d615	t	f	webauthn-register-passwordless	80
\.


--
-- Data for Name: resource_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_attribute (id, name, value, resource_id) FROM stdin;
\.


--
-- Data for Name: resource_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_policy (resource_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_scope (resource_id, scope_id) FROM stdin;
\.


--
-- Data for Name: resource_server; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server (id, allow_rs_remote_mgmt, policy_enforce_mode, decision_strategy) FROM stdin;
\.


--
-- Data for Name: resource_server_perm_ticket; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_perm_ticket (id, owner, requester, created_timestamp, granted_timestamp, resource_id, scope_id, resource_server_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_server_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_policy (id, name, description, type, decision_strategy, logic, resource_server_id, owner) FROM stdin;
\.


--
-- Data for Name: resource_server_resource; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_resource (id, name, type, icon_uri, owner, resource_server_id, owner_managed_access, display_name) FROM stdin;
\.


--
-- Data for Name: resource_server_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_scope (id, name, icon_uri, resource_server_id, display_name) FROM stdin;
\.


--
-- Data for Name: resource_uris; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_uris (resource_id, value) FROM stdin;
\.


--
-- Data for Name: role_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.role_attribute (id, role_id, name, value) FROM stdin;
\.


--
-- Data for Name: scope_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.scope_mapping (client_id, role_id) FROM stdin;
7ea80c92-3515-4b04-aff9-7f1705afa3ed	72f06a0b-935d-49bb-9f4e-0d81a61847bd
7ea80c92-3515-4b04-aff9-7f1705afa3ed	71c7305f-e38e-4e29-9c30-aa7a8c95e555
ce36e3cf-12d4-45c1-a954-af3e053acec8	a9b03f3d-77cd-4c58-be75-1ebbb955a366
ce36e3cf-12d4-45c1-a954-af3e053acec8	d5985d55-a7e7-428b-ad3c-2a872e1badca
\.


--
-- Data for Name: scope_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.scope_policy (scope_id, policy_id) FROM stdin;
\.


--
-- Data for Name: user_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_attribute (name, value, user_id, id) FROM stdin;
purpose_of_use	treatment	5e6ad5b3-2470-4bf1-907c-fbc5829c53d1	96033ebf-37ae-4b40-b853-c9ed160a692f
dept	internal	5e6ad5b3-2470-4bf1-907c-fbc5829c53d1	bfea0206-09bd-4c81-924b-f7f97a01181e
purpose_of_use	administration	7dee04d6-8d96-4dff-ac2b-fd0579ea2969	40ed1b63-b0ee-4b2d-8e20-bcf465086852
dept	administration	7dee04d6-8d96-4dff-ac2b-fd0579ea2969	d68e2308-4e44-4c5d-bbc8-b9f4504cc976
purpose_of_use	patient_access	bfd0e61e-06bc-4312-a666-d98f407ebe71	65d1cd18-944e-4f53-a760-45491eb3e57e
patient_id	patient-001	bfd0e61e-06bc-4312-a666-d98f407ebe71	0aebc8c6-db33-4eff-8aec-434a90eb992e
purpose_of_use	administrative	9b158f25-36dd-4d7b-8a7b-c20eb0236d16	3c1b33e0-cefb-4417-afdc-c52ef608bf69
dept	reception	9b158f25-36dd-4d7b-8a7b-c20eb0236d16	977ef27b-f707-4de3-9bbf-d5d86da95fd6
role	patient	1d3d59ea-7263-42ed-990e-8f53be9799c7	f2c5dcb1-6362-464b-bb17-9f81fe4a33c1
role	doctor	d83a9b02-f086-40ea-80d7-a2fe3dcc35a1	775b32b3-0f36-48ea-accc-60063b1346f6
role	head_reception	fb3da867-3ef9-49b5-b07e-d0d66d885046	509c9c4c-2095-458d-8d11-23d8b015155d
role	lab_technician	6bb08b33-b96f-4be3-b637-ff2c05a8e831	cbef228c-d93c-4400-abe6-7f8aeacfc415
role	nurse	db2a7d0b-96a3-4530-83bc-a8a81b19cb11	512771e1-2cf7-481c-9bdc-5ffef7299940
role	nurse_cardiology	35242367-7c51-4ea3-920f-92e5b6e8b9f8	c57b1bd8-8d9b-4fc0-8610-a596dc4b47d3
role	nurse_cardiology	019e33bf-d5f8-4565-958f-702b0afdccde	b5d5d819-2c33-4306-83fd-c2ff771c9f48
role	nurse_cardiology	fa15f803-68ae-4964-9854-65caa8c08032	dad3688c-6393-49f3-ab2a-2f83e5879e0d
role	nurse_emergency	62ccb310-11f1-4c17-82f9-34252d1cefe0	7bdd2152-fe12-477b-8668-4951f63b4cd8
role	nurse_emergency	d992d8ec-090a-4031-8a0d-01bb73c92ac2	79abe061-215c-457d-bbd0-a14a434636db
role	nurse_emergency	7433e707-3caf-47c6-8172-1878937cfc5a	16e8ae3f-157a-4375-b6ba-078fdcc299f3
role	nurse_icu	5e2651ac-874e-46ed-8bba-d88e6c5bc242	f115a2d5-d0af-427f-9df4-b5216dec2c4c
role	nurse_icu	7f2c1749-1485-43ce-a183-d64a5b002fbb	772a6c67-f82d-4b55-9ad7-98ab131fae85
role	nurse_icu	6bea7c83-91ef-4db0-895c-255ce30e3722	6f88d006-6637-4fed-a3f6-e53d9f4e7bf0
role	nurse_internal	de114ee3-f6ba-4f95-a20e-fde8bbad07d4	58d00c18-febe-424d-b35b-2e98b5e4a934
role	nurse_internal	fb292029-927c-4f18-8cba-fe6113a4d336	c59a053f-b4b8-445d-82c9-3bf10d6ce8a4
role	nurse_internal	48ee943f-3139-4dfb-bf99-6d152213d5b9	b61932e0-1abb-413a-8731-4604ee3f7264
role	nurse_neurology	4c5014a3-ff6e-473c-8dbc-a8301566e05f	5ec1182c-36c2-41fc-b6eb-a3189cc04728
role	nurse_neurology	b856117d-52a4-4099-83a6-f8a846bd09e0	9f5b4971-7d04-4273-a6f0-778cff227a63
role	nurse_neurology	c95268c6-cc94-4c8c-b8fb-d293a0f77fe3	b9254edd-3bc7-49b5-bb83-1b497717ba7a
role	nurse_obstetrics	87d9e39e-efbb-4626-857e-9c32e5b1d91e	5e21f589-eab5-42d8-8a4a-72411205d345
role	nurse_obstetrics	44226acb-3108-4882-b778-bd6e3c72e048	07c4ca84-0994-44ae-aaab-2f9457269ef6
role	nurse_obstetrics	d5f9731c-4592-437a-9662-8bc697b842f1	b9999e31-af1a-4695-9f1b-5377269f0fc9
role	nurse_orthopedics	bf85900a-1052-4a89-b6d2-2ce1c2820f37	e89d0c7d-2567-4141-afe1-ec7b85377a5b
role	nurse_orthopedics	a87afc68-4ad6-46ba-b5aa-24fb07921a17	b06451bd-bcc6-4bab-a906-7e36f5bb94cd
role	nurse_orthopedics	29b4436d-434b-473f-9186-f5c348a8fdc8	3df2906c-39b3-4787-86b6-fd8151cd07a6
role	nurse_pediatrics	da01c564-3ac2-4cdd-a048-b08c5a41d027	d5ac8f4a-0a57-408a-82f0-b239c2bd30d5
role	nurse_pediatrics	4dfcb1be-b286-4174-9535-9c711ee77617	04b08578-9810-4c79-acc4-8b39071166de
role	nurse_pediatrics	913f8a89-b01e-4b6f-bb1e-10e296c6eb55	abd388b6-d1bd-47b5-bb58-7c0d7d57791e
role	nurse_surgery	a6851568-7149-47d1-a419-05732bcc3d4d	8f1164fc-5e91-497d-892e-a6cf00aef6f2
role	nurse_surgery	a2ccc12f-8732-4024-9cd2-da3332114799	0f2c4f03-f253-4857-a91d-6ca1bfa00df1
role	nurse_surgery	fd267a4b-de80-48db-ac91-e1cae71c7762	7cd71dc7-f7cf-4e6b-937d-720d75b75f20
role	patient	d49f5149-814b-4934-a12f-0b8bf859c06d	37b08ded-df29-4cdf-ba95-75d4adb6f9d5
role	patient	a37264b4-9034-4aa8-bbbf-35da1d743031	66c502b0-db0e-402b-9091-ee6a16411dee
role	patient	7d2ddf13-187f-4732-97c2-5c72996b1d4a	0dd8fe6c-b98b-44ae-abc2-51b355fafb43
role	patient	880d0360-86c4-428a-a3ca-f5259a469336	3454dc9a-2c60-45cc-8c86-52e4b08d0d73
role	patient	ea78163a-6aaf-4fd4-94ff-738423b7d64d	e4f01d4f-c8a0-450f-9b52-59be9e51bc26
role	receptionist	38a2ea8c-9dbe-486f-8dd4-2ca1f1b67d13	d7949000-cd64-4f3f-a5ab-6360fcc1d73b
role	receptionist	bbf21422-b11e-440c-a43b-6a3ad74d433f	e685077e-2451-4314-a6c8-d297d855ee14
role	receptionist	dad92fd4-7c2f-4347-b607-8cb949704022	d1aceecc-250e-45fd-a624-4918cc7b2db4
purpose_of_use	treatment	78239225-5692-45a2-b0d1-c4f811582aa2	96f1a312-8d88-4001-904b-d3cf2d212b22
dept	cardiology	78239225-5692-45a2-b0d1-c4f811582aa2	4e4edaae-48f2-4d06-aa3e-6071b43cc993
purpose_of_use	treatment	4bc3d178-a769-4687-9e97-e71cb687c0dd	0f2540a3-3e53-48fd-9929-94687ffdbff2
dept	dentistry	4bc3d178-a769-4687-9e97-e71cb687c0dd	6b47c82a-fc93-45b6-a4c0-54e15e5a435a
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_consent (id, client_id, user_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: user_consent_client_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_consent_client_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: user_entity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_entity (id, email, email_constraint, email_verified, enabled, federation_link, first_name, last_name, realm_id, username, created_timestamp, service_account_client_link, not_before) FROM stdin;
b9b1d197-52c8-4359-b642-410bdbee9a7a	\N	3b655fa3-ec62-4090-bf80-9e23b2f917d4	f	t	\N	\N	\N	c65e68c8-80c1-4eaa-ad03-fbd3aaacd495	admin	1761947407662	\N	0
3cc30c6f-b742-436e-b49f-d3d3be8ae027	0923492123@gmail.com	0923492123@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn1712179198	1763617176399	\N	0
d83a9b02-f086-40ea-80d7-a2fe3dcc35a1	bs.chanthuong@archive.local	bs.chanthuong@archive.local	t	f	\N	bs	noikhoa	39799f2c-4662-4089-918d-99875bb5d615	bs.chanthuong	1762480121473	\N	0
a749f176-9162-4782-baf2-725f598a91e9	0912321123@gmail.com	0912321123@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn1762335180	1763617654976	\N	0
ee6d1901-03fb-4e2a-9ca6-db3e6772c3c4	0923205300@gmail.com	0923205300@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn2684754181	1763626883874	\N	0
7dee04d6-8d96-4dff-ac2b-fd0579ea2969	admin@example.com	admin@example.com	t	t	\N	Admin	User	39799f2c-4662-4089-918d-99875bb5d615	admin.user	\N	\N	0
bfd0e61e-06bc-4312-a666-d98f407ebe71	anna.patient@example.com	anna.patient@example.com	t	t	\N	Anna	Patient	39799f2c-4662-4089-918d-99875bb5d615	patient.anna	\N	\N	0
9b158f25-36dd-4d7b-8a7b-c20eb0236d16	mary.receptionist@hospital.com	mary.receptionist@hospital.com	t	t	\N	Mary	Receptionist	39799f2c-4662-4089-918d-99875bb5d615	receptionist.mary	\N	\N	0
1d3d59ea-7263-42ed-990e-8f53be9799c7	vu22@gmail.com	vu22@gmail.com	t	t	\N	vu22	User	39799f2c-4662-4089-918d-99875bb5d615	vu22	1762480117887	\N	0
14d6f0b8-b678-4ce6-8609-1afe5e4d93ff	hoangngheo@gmail.com	hoangngheo@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn0056086774	1762600593582	\N	0
ad34f204-2718-4675-94e7-dd27b0f25910	0991231213@gmail.com	0991231213@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn1832772148	1763618388342	\N	0
fb3da867-3ef9-49b5-b07e-d0d66d885046	truong.letan@clinic.com	truong.letan@clinic.com	t	t	\N	truong	letan	39799f2c-4662-4089-918d-99875bb5d615	truong.letan	1762480128660	\N	0
6bb08b33-b96f-4be3-b637-ff2c05a8e831	ktv.dung@clinic.com	ktv.dung@clinic.com	t	t	\N	ktv	dung	39799f2c-4662-4089-918d-99875bb5d615	ktv.dung	1762480128937	\N	0
db2a7d0b-96a3-4530-83bc-a8a81b19cb11	dd.ha@clinic.com	dd.ha@clinic.com	t	t	\N	dd	ha	39799f2c-4662-4089-918d-99875bb5d615	dd.ha	1762480131393	\N	0
35242367-7c51-4ea3-920f-92e5b6e8b9f8	lan.cardio@hospital.com	lan.cardio@hospital.com	t	t	\N	nurse	lan	39799f2c-4662-4089-918d-99875bb5d615	nurse.lan.cardio	1762480132192	\N	0
019e33bf-d5f8-4565-958f-702b0afdccde	mai.cardio@hospital.com	mai.cardio@hospital.com	t	t	\N	nurse	mai	39799f2c-4662-4089-918d-99875bb5d615	nurse.mai.cardio	1762480132454	\N	0
fa15f803-68ae-4964-9854-65caa8c08032	hoa.cardio@hospital.com	hoa.cardio@hospital.com	t	t	\N	nurse	hoa	39799f2c-4662-4089-918d-99875bb5d615	nurse.hoa.cardio	1762480132721	\N	0
62ccb310-11f1-4c17-82f9-34252d1cefe0	kim.emergency@hospital.com	kim.emergency@hospital.com	t	t	\N	nurse	kim	39799f2c-4662-4089-918d-99875bb5d615	nurse.kim.emergency	1762480132979	\N	0
d992d8ec-090a-4031-8a0d-01bb73c92ac2	chi.emergency@hospital.com	chi.emergency@hospital.com	t	t	\N	nurse	chi	39799f2c-4662-4089-918d-99875bb5d615	nurse.chi.emergency	1762480133236	\N	0
7433e707-3caf-47c6-8172-1878937cfc5a	hong.emergency@hospital.com	hong.emergency@hospital.com	t	t	\N	nurse	hong	39799f2c-4662-4089-918d-99875bb5d615	nurse.hong.emergency	1762480133499	\N	0
5e2651ac-874e-46ed-8bba-d88e6c5bc242	binh.icu@hospital.com	binh.icu@hospital.com	t	t	\N	nurse	binh	39799f2c-4662-4089-918d-99875bb5d615	nurse.binh.icu	1762480133763	\N	0
7f2c1749-1485-43ce-a183-d64a5b002fbb	nhi.icu@hospital.com	nhi.icu@hospital.com	t	t	\N	nurse	nhi	39799f2c-4662-4089-918d-99875bb5d615	nurse.nhi.icu	1762480134024	\N	0
6bea7c83-91ef-4db0-895c-255ce30e3722	my.icu@hospital.com	my.icu@hospital.com	t	t	\N	nurse	my	39799f2c-4662-4089-918d-99875bb5d615	nurse.my.icu	1762480134290	\N	0
de114ee3-f6ba-4f95-a20e-fde8bbad07d4	thu.internal@hospital.com	thu.internal@hospital.com	t	t	\N	nurse	thu	39799f2c-4662-4089-918d-99875bb5d615	nurse.thu.internal	1762480134551	\N	0
fb292029-927c-4f18-8cba-fe6113a4d336	huong.internal@hospital.com	huong.internal@hospital.com	t	t	\N	nurse	huong	39799f2c-4662-4089-918d-99875bb5d615	nurse.huong.internal	1762480134816	\N	0
48ee943f-3139-4dfb-bf99-6d152213d5b9	linh.internal@hospital.com	linh.internal@hospital.com	t	t	\N	nurse	linh	39799f2c-4662-4089-918d-99875bb5d615	nurse.linh.internal	1762480135079	\N	0
4c5014a3-ff6e-473c-8dbc-a8301566e05f	van.neurology@hospital.com	van.neurology@hospital.com	t	t	\N	nurse	van	39799f2c-4662-4089-918d-99875bb5d615	nurse.van.neurology	1762480135344	\N	0
b856117d-52a4-4099-83a6-f8a846bd09e0	tuyet.neurology@hospital.com	tuyet.neurology@hospital.com	t	t	\N	nurse	tuyet	39799f2c-4662-4089-918d-99875bb5d615	nurse.tuyet.neurology	1762480135627	\N	0
c95268c6-cc94-4c8c-b8fb-d293a0f77fe3	hanh.neurology@hospital.com	hanh.neurology@hospital.com	t	t	\N	nurse	hanh	39799f2c-4662-4089-918d-99875bb5d615	nurse.hanh.neurology	1762480135894	\N	0
87d9e39e-efbb-4626-857e-9c32e5b1d91e	hang.obstetrics@hospital.com	hang.obstetrics@hospital.com	t	t	\N	nurse	hang	39799f2c-4662-4089-918d-99875bb5d615	nurse.hang.obstetrics	1762480136161	\N	0
44226acb-3108-4882-b778-bd6e3c72e048	dung.obstetrics@hospital.com	dung.obstetrics@hospital.com	t	t	\N	nurse	dung	39799f2c-4662-4089-918d-99875bb5d615	nurse.dung.obstetrics	1762480136419	\N	0
5e6ad5b3-2470-4bf1-907c-fbc5829c53d1	bs.noikhoa@clinic.com	bs.noikhoa@clinic.com	t	t	\N	BS	Nß╗Öi khoa	39799f2c-4662-4089-918d-99875bb5d615	bs.noikhoa	1763035400841	\N	0
d5f9731c-4592-437a-9662-8bc697b842f1	nhung.obstetrics@hospital.com	nhung.obstetrics@hospital.com	t	t	\N	nurse	nhung	39799f2c-4662-4089-918d-99875bb5d615	nurse.nhung.obstetrics	1762480136683	\N	0
dd85e674-1379-41f3-9a80-b8eac1096c97	bn0130339988@gmail.com	bn0130339988@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn0130339988	1762601326989	\N	0
bf85900a-1052-4a89-b6d2-2ce1c2820f37	quynh.orthopedics@hospital.com	quynh.orthopedics@hospital.com	t	t	\N	nurse	quynh	39799f2c-4662-4089-918d-99875bb5d615	nurse.quynh.orthopedics	1762480136952	\N	0
a87afc68-4ad6-46ba-b5aa-24fb07921a17	loan.orthopedics@hospital.com	loan.orthopedics@hospital.com	t	t	\N	nurse	loan	39799f2c-4662-4089-918d-99875bb5d615	nurse.loan.orthopedics	1762480137304	\N	0
6612b52d-8ec6-4ebd-a35d-c219a98fdd04	alaluot@gmail.com	alaluot@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7153438579	1762671540297	\N	0
29b4436d-434b-473f-9186-f5c348a8fdc8	tam.orthopedics@hospital.com	tam.orthopedics@hospital.com	t	t	\N	nurse	tam	39799f2c-4662-4089-918d-99875bb5d615	nurse.tam.orthopedics	1762480137667	\N	0
da01c564-3ac2-4cdd-a048-b08c5a41d027	anh.pediatrics@hospital.com	anh.pediatrics@hospital.com	t	t	\N	nurse	anh	39799f2c-4662-4089-918d-99875bb5d615	nurse.anh.pediatrics	1762480137960	\N	0
3d1dbd09-25ca-4f02-8972-7c242c3a5c08	alaluot12@gmail.com	alaluot12@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7160940043	1762671610750	\N	0
4dfcb1be-b286-4174-9535-9c711ee77617	thao.pediatrics@hospital.com	thao.pediatrics@hospital.com	t	t	\N	nurse	thao	39799f2c-4662-4089-918d-99875bb5d615	nurse.thao.pediatrics	1762480138222	\N	0
913f8a89-b01e-4b6f-bb1e-10e296c6eb55	yen.pediatrics@hospital.com	yen.pediatrics@hospital.com	t	t	\N	nurse	yen	39799f2c-4662-4089-918d-99875bb5d615	nurse.yen.pediatrics	1762480138491	\N	0
a8e1d791-31f0-43ae-8279-da92e377e184	linhlung22@gmail.com	linhlung22@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7162805998	1762671705479	\N	0
a6851568-7149-47d1-a419-05732bcc3d4d	nga.surgery@hospital.com	nga.surgery@hospital.com	t	t	\N	nurse	nga	39799f2c-4662-4089-918d-99875bb5d615	nurse.nga.surgery	1762480138757	\N	0
a2ccc12f-8732-4024-9cd2-da3332114799	trang.surgery@hospital.com	trang.surgery@hospital.com	t	t	\N	nurse	trang	39799f2c-4662-4089-918d-99875bb5d615	nurse.trang.surgery	1762480139035	\N	0
0765faa9-b6ac-4fc2-9d67-163eea5d7cb3	phaodagang93@gmail.com	phaodagang93@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7171142752	1762671756782	\N	0
fd267a4b-de80-48db-ac91-e1cae71c7762	phuong.surgery@hospital.com	phuong.surgery@hospital.com	t	t	\N	nurse	phuong	39799f2c-4662-4089-918d-99875bb5d615	nurse.phuong.surgery	1762480139302	\N	0
d49f5149-814b-4934-a12f-0b8bf859c06d	nguyenvana@email.com	nguyenvana@email.com	t	t	\N	bn	nguyenvana	39799f2c-4662-4089-918d-99875bb5d615	bn.nguyenvana	1762480139573	\N	0
890607cf-d45c-4799-93ec-1d3364353c7d	luyencute123@gmail.com	luyencute123@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7176548572	1762671818678	\N	0
a37264b4-9034-4aa8-bbbf-35da1d743031	tranthib@email.com	tranthib@email.com	t	t	\N	bn	tranthib	39799f2c-4662-4089-918d-99875bb5d615	bn.tranthib	1762480139848	\N	0
7d2ddf13-187f-4732-97c2-5c72996b1d4a	levanc@email.com	levanc@email.com	t	t	\N	bn	levanc	39799f2c-4662-4089-918d-99875bb5d615	bn.levanc	1762480140117	\N	0
675533f9-fea3-4d9d-b842-d1bed619c742	mongmo77@gmail.com	mongmo77@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7182373759	1762671870393	\N	0
880d0360-86c4-428a-a3ca-f5259a469336	phamthid@email.com	phamthid@email.com	t	t	\N	bn	phamthid	39799f2c-4662-4089-918d-99875bb5d615	bn.phamthid	1762480140376	\N	0
ea78163a-6aaf-4fd4-94ff-738423b7d64d	hoangvane@email.com	hoangvane@email.com	t	t	\N	bn	hoangvane	39799f2c-4662-4089-918d-99875bb5d615	bn.hoangvane	1762480140642	\N	0
065cb48f-8065-45b1-a99e-955cd5028e34	mongmo22@gmail.com	mongmo22@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7189670228	1762671930848	\N	0
38a2ea8c-9dbe-486f-8dd4-2ca1f1b67d13	letan.mai@clinic.com	letan.mai@clinic.com	t	t	\N	letan	mai	39799f2c-4662-4089-918d-99875bb5d615	letan.mai	1762480141186	\N	0
07d4219a-4824-4586-b749-1b2328fffd9a	kieuolaungungbich98@gmail.com	kieuolaungungbich98@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7193665390	1762671987812	\N	0
bbf21422-b11e-440c-a43b-6a3ad74d433f	letan.lan@clinic.com	letan.lan@clinic.com	t	t	\N	letan	lan	39799f2c-4662-4089-918d-99875bb5d615	letan.lan	1762480141449	\N	0
dad92fd4-7c2f-4347-b607-8cb949704022	letan.hoa@clinic.com	letan.hoa@clinic.com	t	t	\N	letan	hoa	39799f2c-4662-4089-918d-99875bb5d615	letan.hoa	1762480141733	\N	0
a62a0cd7-9226-4db3-b514-3433420a9e22	thoso34@gmail.com	thoso34@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7199360810	1762672063109	\N	0
6f2edc0d-f054-410c-9a48-f399a4b1147a	huyenkute23@gmail.com	huyenkute23@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7207483075	1762672155830	\N	0
a20d17ef-a170-47f0-97e4-0b9cd6ff8361	tuanminh29@gmail.com	tuanminh29@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7216285810	1762672221807	\N	0
838df798-31fb-494f-b8d7-3bcae1180513	sangmaichunhat22@gmail.com	sangmaichunhat22@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7228572437	1762672331318	\N	0
a2e6b90e-c128-4a31-b2eb-3f92a806aafd	mithitxiu22@gmail.com	mithitxiu22@gmail.com	t	t	\N	\N	\N	39799f2c-4662-4089-918d-99875bb5d615	bn7243951485	1762672517002	\N	0
78239225-5692-45a2-b0d1-c4f811582aa2	hoang.cardio@hospital.com	hoang.cardio@hospital.com	t	t	\N	Hoang	Cardio	39799f2c-4662-4089-918d-99875bb5d615	dr.hoang.cardio	1762957949659	\N	0
4bc3d178-a769-4687-9e97-e71cb687c0dd	nguyen.dental@hospital.com	nguyen.dental@hospital.com	t	t	\N	Nguyen	Dental	39799f2c-4662-4089-918d-99875bb5d615	dr.nguyen.dental	1762957949838	\N	0
\.


--
-- Data for Name: user_federation_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_config (user_federation_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_mapper (id, name, federation_provider_id, federation_mapper_type, realm_id) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_mapper_config (user_federation_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_provider; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_provider (id, changed_sync_period, display_name, full_sync_period, last_sync, priority, provider_name, realm_id) FROM stdin;
\.


--
-- Data for Name: user_group_membership; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_group_membership (group_id, user_id) FROM stdin;
\.


--
-- Data for Name: user_required_action; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_required_action (user_id, required_action) FROM stdin;
\.


--
-- Data for Name: user_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_role_mapping (role_id, user_id) FROM stdin;
9fdf86cb-8348-49f2-9423-d5ab895a17d0	3cc30c6f-b742-436e-b49f-d3d3be8ae027
b3607f0d-6e82-401c-9b8c-416cbbaa811c	b9b1d197-52c8-4359-b642-410bdbee9a7a
877980c3-44ac-4ab8-90b4-c5e493df9ec8	b9b1d197-52c8-4359-b642-410bdbee9a7a
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	3cc30c6f-b742-436e-b49f-d3d3be8ae027
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a749f176-9162-4782-baf2-725f598a91e9
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	a749f176-9162-4782-baf2-725f598a91e9
9fdf86cb-8348-49f2-9423-d5ab895a17d0	ee6d1901-03fb-4e2a-9ca6-db3e6772c3c4
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	ee6d1901-03fb-4e2a-9ca6-db3e6772c3c4
c0190fa7-c0f8-4bc9-a115-bcb26e73851b	7dee04d6-8d96-4dff-ac2b-fd0579ea2969
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	bfd0e61e-06bc-4312-a666-d98f407ebe71
000c8145-2cd6-4087-9bbd-7c3f094f5c52	9b158f25-36dd-4d7b-8a7b-c20eb0236d16
9fdf86cb-8348-49f2-9423-d5ab895a17d0	1d3d59ea-7263-42ed-990e-8f53be9799c7
9fdf86cb-8348-49f2-9423-d5ab895a17d0	d83a9b02-f086-40ea-80d7-a2fe3dcc35a1
9fdf86cb-8348-49f2-9423-d5ab895a17d0	fb3da867-3ef9-49b5-b07e-d0d66d885046
9fdf86cb-8348-49f2-9423-d5ab895a17d0	6bb08b33-b96f-4be3-b637-ff2c05a8e831
9fdf86cb-8348-49f2-9423-d5ab895a17d0	db2a7d0b-96a3-4530-83bc-a8a81b19cb11
9fdf86cb-8348-49f2-9423-d5ab895a17d0	35242367-7c51-4ea3-920f-92e5b6e8b9f8
9fdf86cb-8348-49f2-9423-d5ab895a17d0	019e33bf-d5f8-4565-958f-702b0afdccde
9fdf86cb-8348-49f2-9423-d5ab895a17d0	fa15f803-68ae-4964-9854-65caa8c08032
9fdf86cb-8348-49f2-9423-d5ab895a17d0	62ccb310-11f1-4c17-82f9-34252d1cefe0
9fdf86cb-8348-49f2-9423-d5ab895a17d0	d992d8ec-090a-4031-8a0d-01bb73c92ac2
9fdf86cb-8348-49f2-9423-d5ab895a17d0	7433e707-3caf-47c6-8172-1878937cfc5a
9fdf86cb-8348-49f2-9423-d5ab895a17d0	5e2651ac-874e-46ed-8bba-d88e6c5bc242
9fdf86cb-8348-49f2-9423-d5ab895a17d0	7f2c1749-1485-43ce-a183-d64a5b002fbb
9fdf86cb-8348-49f2-9423-d5ab895a17d0	6bea7c83-91ef-4db0-895c-255ce30e3722
9fdf86cb-8348-49f2-9423-d5ab895a17d0	de114ee3-f6ba-4f95-a20e-fde8bbad07d4
9fdf86cb-8348-49f2-9423-d5ab895a17d0	fb292029-927c-4f18-8cba-fe6113a4d336
9fdf86cb-8348-49f2-9423-d5ab895a17d0	48ee943f-3139-4dfb-bf99-6d152213d5b9
9fdf86cb-8348-49f2-9423-d5ab895a17d0	4c5014a3-ff6e-473c-8dbc-a8301566e05f
9fdf86cb-8348-49f2-9423-d5ab895a17d0	b856117d-52a4-4099-83a6-f8a846bd09e0
9fdf86cb-8348-49f2-9423-d5ab895a17d0	c95268c6-cc94-4c8c-b8fb-d293a0f77fe3
9fdf86cb-8348-49f2-9423-d5ab895a17d0	87d9e39e-efbb-4626-857e-9c32e5b1d91e
9fdf86cb-8348-49f2-9423-d5ab895a17d0	44226acb-3108-4882-b778-bd6e3c72e048
9fdf86cb-8348-49f2-9423-d5ab895a17d0	d5f9731c-4592-437a-9662-8bc697b842f1
9fdf86cb-8348-49f2-9423-d5ab895a17d0	bf85900a-1052-4a89-b6d2-2ce1c2820f37
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a87afc68-4ad6-46ba-b5aa-24fb07921a17
9fdf86cb-8348-49f2-9423-d5ab895a17d0	29b4436d-434b-473f-9186-f5c348a8fdc8
9fdf86cb-8348-49f2-9423-d5ab895a17d0	da01c564-3ac2-4cdd-a048-b08c5a41d027
9fdf86cb-8348-49f2-9423-d5ab895a17d0	4dfcb1be-b286-4174-9535-9c711ee77617
9fdf86cb-8348-49f2-9423-d5ab895a17d0	913f8a89-b01e-4b6f-bb1e-10e296c6eb55
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a6851568-7149-47d1-a419-05732bcc3d4d
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a2ccc12f-8732-4024-9cd2-da3332114799
9fdf86cb-8348-49f2-9423-d5ab895a17d0	fd267a4b-de80-48db-ac91-e1cae71c7762
9fdf86cb-8348-49f2-9423-d5ab895a17d0	d49f5149-814b-4934-a12f-0b8bf859c06d
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a37264b4-9034-4aa8-bbbf-35da1d743031
9fdf86cb-8348-49f2-9423-d5ab895a17d0	7d2ddf13-187f-4732-97c2-5c72996b1d4a
9fdf86cb-8348-49f2-9423-d5ab895a17d0	880d0360-86c4-428a-a3ca-f5259a469336
9fdf86cb-8348-49f2-9423-d5ab895a17d0	ea78163a-6aaf-4fd4-94ff-738423b7d64d
9fdf86cb-8348-49f2-9423-d5ab895a17d0	ad34f204-2718-4675-94e7-dd27b0f25910
9fdf86cb-8348-49f2-9423-d5ab895a17d0	38a2ea8c-9dbe-486f-8dd4-2ca1f1b67d13
9fdf86cb-8348-49f2-9423-d5ab895a17d0	bbf21422-b11e-440c-a43b-6a3ad74d433f
9fdf86cb-8348-49f2-9423-d5ab895a17d0	dad92fd4-7c2f-4347-b607-8cb949704022
9fdf86cb-8348-49f2-9423-d5ab895a17d0	14d6f0b8-b678-4ce6-8609-1afe5e4d93ff
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	14d6f0b8-b678-4ce6-8609-1afe5e4d93ff
9fdf86cb-8348-49f2-9423-d5ab895a17d0	dd85e674-1379-41f3-9a80-b8eac1096c97
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	dd85e674-1379-41f3-9a80-b8eac1096c97
9fdf86cb-8348-49f2-9423-d5ab895a17d0	6612b52d-8ec6-4ebd-a35d-c219a98fdd04
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	6612b52d-8ec6-4ebd-a35d-c219a98fdd04
9fdf86cb-8348-49f2-9423-d5ab895a17d0	3d1dbd09-25ca-4f02-8972-7c242c3a5c08
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	3d1dbd09-25ca-4f02-8972-7c242c3a5c08
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a8e1d791-31f0-43ae-8279-da92e377e184
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	a8e1d791-31f0-43ae-8279-da92e377e184
9fdf86cb-8348-49f2-9423-d5ab895a17d0	0765faa9-b6ac-4fc2-9d67-163eea5d7cb3
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	0765faa9-b6ac-4fc2-9d67-163eea5d7cb3
9fdf86cb-8348-49f2-9423-d5ab895a17d0	890607cf-d45c-4799-93ec-1d3364353c7d
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	890607cf-d45c-4799-93ec-1d3364353c7d
9fdf86cb-8348-49f2-9423-d5ab895a17d0	675533f9-fea3-4d9d-b842-d1bed619c742
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	675533f9-fea3-4d9d-b842-d1bed619c742
9fdf86cb-8348-49f2-9423-d5ab895a17d0	065cb48f-8065-45b1-a99e-955cd5028e34
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	065cb48f-8065-45b1-a99e-955cd5028e34
9fdf86cb-8348-49f2-9423-d5ab895a17d0	07d4219a-4824-4586-b749-1b2328fffd9a
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	07d4219a-4824-4586-b749-1b2328fffd9a
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a62a0cd7-9226-4db3-b514-3433420a9e22
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	a62a0cd7-9226-4db3-b514-3433420a9e22
9fdf86cb-8348-49f2-9423-d5ab895a17d0	6f2edc0d-f054-410c-9a48-f399a4b1147a
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	6f2edc0d-f054-410c-9a48-f399a4b1147a
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a20d17ef-a170-47f0-97e4-0b9cd6ff8361
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	a20d17ef-a170-47f0-97e4-0b9cd6ff8361
9fdf86cb-8348-49f2-9423-d5ab895a17d0	838df798-31fb-494f-b8d7-3bcae1180513
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	838df798-31fb-494f-b8d7-3bcae1180513
9fdf86cb-8348-49f2-9423-d5ab895a17d0	a2e6b90e-c128-4a31-b2eb-3f92a806aafd
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	a2e6b90e-c128-4a31-b2eb-3f92a806aafd
9fdf86cb-8348-49f2-9423-d5ab895a17d0	78239225-5692-45a2-b0d1-c4f811582aa2
ec304313-d5ca-447e-a0b1-6db603f24351	78239225-5692-45a2-b0d1-c4f811582aa2
72304f89-5c75-42f2-a84b-2c56da7807d1	78239225-5692-45a2-b0d1-c4f811582aa2
9fdf86cb-8348-49f2-9423-d5ab895a17d0	4bc3d178-a769-4687-9e97-e71cb687c0dd
ec304313-d5ca-447e-a0b1-6db603f24351	4bc3d178-a769-4687-9e97-e71cb687c0dd
b96a0605-0119-4f91-9cb9-00f160e846b1	4bc3d178-a769-4687-9e97-e71cb687c0dd
9fdf86cb-8348-49f2-9423-d5ab895a17d0	5e6ad5b3-2470-4bf1-907c-fbc5829c53d1
ec304313-d5ca-447e-a0b1-6db603f24351	5e6ad5b3-2470-4bf1-907c-fbc5829c53d1
6f2fe7a3-2bd2-4629-a93d-b4b69306aef5	ad34f204-2718-4675-94e7-dd27b0f25910
\.


--
-- Data for Name: user_session; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_session (id, auth_method, ip_address, last_session_refresh, login_username, realm_id, remember_me, started, user_id, user_session_state, broker_session_id, broker_user_id) FROM stdin;
\.


--
-- Data for Name: user_session_note; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_session_note (user_session, name, value) FROM stdin;
\.


--
-- Data for Name: username_login_failure; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.username_login_failure (realm_id, username, failed_login_not_before, last_failure, last_ip_failure, num_failures) FROM stdin;
\.


--
-- Data for Name: web_origins; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.web_origins (client_id, value) FROM stdin;
40fed7d1-fbc3-41d0-b4d9-15bef81aa10c	+
6bbba7bc-3dcc-4dd1-978d-5d79a391ab0c	+
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	*
86bf8a17-a4f1-4204-9cdd-572b9ca60a71	http://localhost:3000
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost
12ee7e32-a154-4be9-ab5c-6f437c15ce71	*
12ee7e32-a154-4be9-ab5c-6f437c15ce71	http://localhost:3001
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost:3002
45324d7c-9871-48eb-933d-f85d78844baf	http://localhost
45324d7c-9871-48eb-933d-f85d78844baf	*
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	http://localhost:8082
5d301a76-7414-41f2-b5f2-507a5a9d3bcc	*
\.


--
-- Name: username_login_failure CONSTRAINT_17-2; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.username_login_failure
    ADD CONSTRAINT "CONSTRAINT_17-2" PRIMARY KEY (realm_id, username);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: client_user_session_note constr_cl_usr_ses_note; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT constr_cl_usr_ses_note PRIMARY KEY (client_session, name);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: client_session_role constraint_5; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT constraint_5 PRIMARY KEY (client_session, role_id);


--
-- Name: user_session constraint_57; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT constraint_57 PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client_session_note constraint_5e; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT constraint_5e PRIMARY KEY (client_session, name);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: client_session constraint_8; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT constraint_8 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: client_session_auth_status constraint_auth_status_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT constraint_auth_status_pk PRIMARY KEY (client_session, authenticator);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: client_session_prot_mapper constraint_cs_pmp_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT constraint_cs_pmp_pk PRIMARY KEY (client_session, protocol_mapper_id);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: user_session_note constraint_usn_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT constraint_usn_pk PRIMARY KEY (user_session, name);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_jkuwuvd56ontgsuhogm8uewrt; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_jkuwuvd56ontgsuhogm8uewrt UNIQUE (client_id, client_storage_provider, external_client_id, user_id);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_admin_event_time ON public.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON public.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_config_realm ON public.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_exec_flow ON public.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_exec_realm_flow ON public.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_flow_realm ON public.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_cl_clscope ON public.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_client_id ON public.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_client_init_acc_realm ON public.client_initial_access USING btree (realm_id);


--
-- Name: idx_client_session_session; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_client_session_session ON public.client_session USING btree (session_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_attrs ON public.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_cl ON public.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_protmap ON public.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_role ON public.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_compo_config_compo ON public.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_component_provider_type ON public.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_component_realm ON public.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_composite ON public.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_composite_child ON public.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_defcls_realm ON public.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_defcls_scope ON public.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_event_time ON public.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fedidentity_feduser ON public.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fedidentity_user ON public.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_attribute ON public.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_cnsnt_ext ON public.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_consent ON public.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_consent_ru ON public.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_credential ON public.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_credential_ru ON public.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_group_membership ON public.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_group_membership_ru ON public.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_required_action ON public.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_required_action_ru ON public.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_role_mapping ON public.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_role_mapping_ru ON public.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_group_att_by_name_value ON public.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_group_attr_group ON public.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_group_role_mapp_group ON public.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_id_prov_mapp_realm ON public.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_ident_prov_realm ON public.identity_provider USING btree (realm_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_keycloak_role_client ON public.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_keycloak_role_realm ON public.keycloak_role USING btree (realm);


--
-- Name: idx_offline_css_preload; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_css_preload ON public.offline_client_session USING btree (client_id, offline_flag);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_by_user ON public.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_offline_uss_by_usersess; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_by_usersess ON public.offline_user_session USING btree (realm_id, offline_flag, user_session_id);


--
-- Name: idx_offline_uss_createdon; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_createdon ON public.offline_user_session USING btree (created_on);


--
-- Name: idx_offline_uss_preload; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_preload ON public.offline_user_session USING btree (offline_flag, created_on, user_session_id);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_protocol_mapper_client ON public.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_attr_realm ON public.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_clscope ON public.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_def_grp_realm ON public.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_evt_list_realm ON public.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_evt_types_realm ON public.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_master_adm_cli ON public.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_supp_local_realm ON public.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_redir_uri_client ON public.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_req_act_prov_realm ON public.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_policy_policy ON public.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_scope_scope ON public.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_serv_pol_res_serv ON public.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_srv_res_res_srv ON public.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_srv_scope_res_srv ON public.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_role_attribute ON public.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_role_clscope ON public.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_scope_mapping_role ON public.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_scope_policy_policy ON public.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_update_time ON public.migration_model USING btree (update_time);


--
-- Name: idx_us_sess_id_on_cl_sess; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_us_sess_id_on_cl_sess ON public.offline_client_session USING btree (user_session_id);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usconsent_clscope ON public.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_attribute ON public.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_attribute_name ON public.user_attribute USING btree (name, value);


--
-- Name: idx_user_consent; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_consent ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_credential ON public.credential USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_email ON public.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_group_mapping ON public.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_reqactions ON public.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_role_mapping ON public.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_service_account ON public.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usr_fed_map_fed_prv ON public.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usr_fed_map_realm ON public.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usr_fed_prv_realm ON public.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_web_orig_client ON public.web_origins USING btree (client_id);


--
-- Name: client_session_auth_status auth_status_constraint; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT auth_status_constraint FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: client_session_note fk5edfb00ff51c2736; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT fk5edfb00ff51c2736 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: user_session_note fk5edfb00ff51d3472; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT fk5edfb00ff51d3472 FOREIGN KEY (user_session) REFERENCES public.user_session(id);


--
-- Name: client_session_role fk_11b7sgqw18i532811v7o2dv76; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT fk_11b7sgqw18i532811v7o2dv76 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session_prot_mapper fk_33a8sgqw18i532811v7o2dk89; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT fk_33a8sgqw18i532811v7o2dk89 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES public.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES public.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES public.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session fk_b4ao2vcvat6ukau74wbwtfqo1; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT fk_b4ao2vcvat6ukau74wbwtfqo1 FOREIGN KEY (session_id) REFERENCES public.user_session(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_user_session_note fk_cl_usr_ses_note; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT fk_cl_usr_ses_note FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES public.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES public.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES public.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES public.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES public.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES public.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES public.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES public.identity_provider(internal_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 0t22MHSUH466lgsKtSjTqJWQZu3Ok5ywakbKDNTiLSWwTx2wEIQKMAD4ShQwgqI

