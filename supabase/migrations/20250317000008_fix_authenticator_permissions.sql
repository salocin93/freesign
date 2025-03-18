-- Grant necessary permissions to authenticator role
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticator;

-- Explicitly grant permissions on specific tables
GRANT ALL ON TABLE public.documents TO authenticator;
GRANT ALL ON TABLE public.recipients TO authenticator;
GRANT ALL ON TABLE public.signatures TO authenticator;
GRANT ALL ON TABLE public.signing_elements TO authenticator;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON TABLES TO authenticator;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON SEQUENCES TO authenticator;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON FUNCTIONS TO authenticator; 