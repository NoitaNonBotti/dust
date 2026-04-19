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

