## Django + React API connection

### Backend model

The Django backend has a `lost_items` app with a basic `LostItem` model:

- `name`
- `category`
- `description`
- `location`
- `date_found`
- `status`
- `image_url`
- `created_at`
- `updated_at`

The model is registered in Django admin and stored in the SQLite database during
local development.

### API endpoints

Run the Django backend from the `dust_django` directory:

```bash
python manage.py runserver
```

Available example endpoints:

```text
GET  http://localhost:8000/api/lost-items/
POST http://localhost:8000/api/lost-items/
```

Example `POST /api/lost-items/` JSON body:

```json
{
  "name": "Blue Backpack",
  "category": "Bags",
  "description": "Navy blue backpack found near the cafeteria.",
  "location": "Cafeteria",
  "imageUrl": ""
}
```

The endpoint also accepts `multipart/form-data` for local image uploads. Use the
same text fields plus an `image` file field. Uploaded images are saved under:

```text
dust_django/media/lost_items/
```

### Database setup

After pulling or creating the model, run migrations from the `dust_django`
directory:

```bash
python manage.py makemigrations lost_items
python manage.py migrate
```

### Frontend connection

The React frontend calls the Django API from:

```text
dust_react/src/app/api/lostItems.ts
```

The Lost Items page tries to load records from:

```text
http://localhost:8000/api/lost-items/
```

If Django is not running, the page falls back to the existing mock data so the
prototype can still be viewed.

The Lost Items page filters records locally after loading them. It supports text
search, category filtering, and date filtering modes for all dates, before a
date, after a date, on a date, and between two dates.

The Lost Items and Admin pages also refresh their item lists automatically. They
reload from Django when the page opens, when the browser window regains focus,
every few seconds while open, and immediately after a report/edit/delete action
announces that item data changed.

The React Admin page at `/admin` is protected by a temporary frontend password
gate. For local development, the password is:

```text
password
```

After unlocking the dashboard, React loads items from the Django API. Admin edit
and delete actions call:

```text
PATCH  http://localhost:8000/api/lost-items/<id>/
DELETE http://localhost:8000/api/lost-items/<id>/
```

Those write requests include a temporary `X-DUST-ADMIN-PASSWORD` header. This is
only a development placeholder and should be replaced with real authentication
before production use.

The Report Item page sends submitted items to Django using `POST
/api/lost-items/`. This is only a basic example connection: it maps the first
selected category to the backend's single `category` field and sends the first
uploaded image as a normal file upload. Django stores that file locally in
`dust_django/media/lost_items/` and returns a `/media/...` URL so React and the
Django homepage can show preview images. A production version should replace
local media storage with a more durable upload/storage setup, plus
authentication, claims APIs, categories, templates, and admin permissions.

To point React at a different backend URL, create a Vite environment variable:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Basic walkthrough

This walkthrough shows the smallest working path for seeing React and Django
communicate with each other.

#### 1. Start the Django backend

Open a terminal from the project root, activate the virtual environment, then go
to the Django project:

```bash
./venv/Scripts/activate.bat
cd dust_django
python manage.py migrate
python manage.py runserver
```

The backend should be running at:

```text
http://localhost:8000/
```

The Django homepage shows a small API dashboard with backend health, item count,
recent saved items, and links to the JSON endpoints.

You can also quickly test the API in your browser by opening:

```text
http://localhost:8000/api/lost-items/
```

If it is working, Django should return a small JSON response

#### 2. Start the React frontend

Open a second terminal from the project root, then run:

```bash
cd dust_react
pnpm run dev
```

Vite should print a local frontend URL, usually:

```text
http://localhost:5173/
```

Open that URL in your browser.

#### 3. Check that React can load Django data

Go to the Lost Items page.

Near the page heading, the app should show one of these messages:

```text
Loaded from the Django API.
```

or:

```text
Django API unavailable; showing mock data.
```

If you see the fallback message, make sure the Django server is still running on
`http://localhost:8000/`.

#### 4. Create a lost item from React

In the React app:

1. Go to `Report Item`.
2. Fill in the item name, category, description, location, and upload at least
   one image.
3. Click `Submit Report`.

The page should show a success message saying the item was reported to the
Django API.

#### 5. Confirm the item was saved

Go back to the Lost Items page. The item you submitted should appear after the
page loads from the Django API.

You can also check the raw API response directly in your browser:

```text
http://localhost:8000/api/lost-items/
```

You should see JSON containing the lost items stored in the SQLite database.
Items with uploaded images will include an `imageUrl` field that points to the
locally saved file.

#### 6. Overview

Basic full-stack flow:

```text
React form

 -> requests from Django API

     -> Django API handles SQLite database

 -> Django API returns result of CRUD operation

React listing
```

The current connection only handles basic lost item records and local development image storage.
