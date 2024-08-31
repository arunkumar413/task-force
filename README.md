# webpack-react-express-template

A simple template to run webpack,react and express server.

Webpack+React+React router+Redux toolkit + Express + Server side session + RBAC

## directory structure

```
├── client
│   ├── dist
│   │   ├── bundle.js
│   │   ├── bundle.js.LICENSE.txt
│   │   └── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── src
│   │   ├── App.js
│   │   ├── index.html
│   │   └── index.js
│   └── webpack.config.js
├── LICENSE
├── README.md
└── server
    ├── index.js
    ├── package.json
    └── package-lock.json

4 directories, 14 files

```

Installation

1. Clone the repo
2. `cd client`
3. Create a `.env` file and set REACT_APP_API_URL=http://localhost:3000/api
4. `npm install` to install the dependencies
5. `npm run serve` to run the app in development mode
6. The app will be served on http://localhost:3030/
7. `npm run build` to build the app for production

Installing the express server

1. `cd server`
2. `npm install`
3. `node index.js` to start the server
4. The api will be served at http://localhost:3000/api and the front end bundled app will be served at http://localhost:3000/

## DB Models:

````sql
CREATE TYPE public.task_status_enum AS ENUM (
'Pending',
'Done',
'In progress'
);```

````

users table:

```sql

CREATE TABLE public.users (
    id integer serial NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    PRIMARY KEY (id)
);

```

table user_roles:

```sql
CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);
```

table roles:

```sql
CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);
```

table permissions:

```sql
CREATE TABLE public.permissions (
    id integer NOT NULL,
    role_id integer,
    resource_id integer,
    read boolean NOT NULL,
    write boolean NOT NULL,
    update boolean NOT NULL,
    delete boolean NOT NULL
);
```

table resources:

```sql
CREATE TABLE public.resources (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(100)
);
```

constraints:

```sql
ALTER TABLE ONLY public.users
	ADD CONSTRAINT unique_email UNIQUE (email);

ALTER TABLE ONLY public.users
	ADD CONSTRAINT users_username_key UNIQUE (username);


ALTER TABLE ONLY public.user_roles
	ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


ALTER TABLE ONLY public.user_roles
	ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


ALTER TABLE ONLY public.roles
	ADD CONSTRAINT roles_name_key UNIQUE (name);

ALTER TABLE ONLY public.roles
	ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.permissions
	ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.permissions
	ADD CONSTRAINT unique_permission_role_resource UNIQUE (role_id, resource_id);


ALTER TABLE ONLY public.permissions
	ADD CONSTRAINT permissions_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);

ALTER TABLE ONLY public.permissions
	ADD CONSTRAINT permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


ALTER TABLE ONLY public.resources
	ADD CONSTRAINT resources_name_key UNIQUE (name);

ALTER TABLE ONLY public.resources
	ADD CONSTRAINT resources_pkey PRIMARY KEY (id);

```
