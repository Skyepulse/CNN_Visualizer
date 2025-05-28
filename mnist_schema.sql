--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: mnist_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mnist_images (
    id integer NOT NULL,
    image_data bytea NOT NULL,
    prediction integer NOT NULL,
    "real" integer NOT NULL,
    client_port integer,
    client_name text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mnist_images OWNER TO postgres;

--
-- Name: mnist_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mnist_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mnist_images_id_seq OWNER TO postgres;

--
-- Name: mnist_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mnist_images_id_seq OWNED BY public.mnist_images.id;


--
-- Name: mnist_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mnist_images ALTER COLUMN id SET DEFAULT nextval('public.mnist_images_id_seq'::regclass);


--
-- Name: mnist_images mnist_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mnist_images
    ADD CONSTRAINT mnist_images_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

