# dust

## Setup

create a virtual environment:
```bash
python -m venv venv
```

run the script in the virtual environment:

For Windows:
```bash
./venv/Scripts/activate.bat
```

For Linux, depending on the shell:

fish shell
```bash
source ./venv/bin/activate.fish
```

bash shell
```bash
source ./venv/bin/activate
```

now you can install all the dependencies using `pip`:
```bash
pip install -r requirements.txt
```

You're done for django!

now for react, you need a nodejs package manager, I use `pnpm`, but you can use `npm`.

after installing that, type this: (just replace pnpm to npm if ur using that)

Go into `dust_react` directory.
```bash
cd dust_react
```

install all the necessary packages:
```bash
pnpm install
```

You're done for react!



## dust_django

## Running the backend

First remember to activate your virtual environment, it's explained above.


Next, you have to go into the `dust_django` directory, then run:
```bash
python manage.py runserver
```

and you have it :)

just copy the url to your browser, and you should have it.

## dust_react

## Running the code

I mainly use `pnpm`

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

just copy the url to your browser, and you should have it.

## Roles and admin accounts

The app supports guest, Google/GBox student, and admin access.

- Guests can browse lost items and send admin inquiries.
- Students login through the official Google/GBox popup, report items, and file/cancel claims.
- Admins login separately with username/password and can access the admin dashboard.

To enable Google/GBox login locally, create a Google OAuth Client ID for a web app and set matching frontend/backend environment variables:

```powershell
# React / Vite terminal
$env:VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
pnpm run dev

# Django terminal
$env:GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
$env:GBOX_ALLOWED_DOMAIN="@your-school-domain.edu"
python manage.py runserver
```

`GBOX_ALLOWED_DOMAIN` is optional during development, but should be set for school-only access.

Admin accounts are managed from the Django console, not the UI:

```bash
cd dust_django
python manage.py create_dust_admin manager --password your-password
python manage.py delete_dust_admin manager
```

Run migrations after pulling backend model changes:

```bash
cd dust_django
python manage.py migrate
```
