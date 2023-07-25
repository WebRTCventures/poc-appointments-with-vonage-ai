# POC: Appointments with Vonage AI

A proof of concept using Vonage AI for appointments.

## Firebase (BaaS)

It relies on Firebase as backend even for local development,
so we have a vendor lock-in, but that's fine for a quick POC.

So open https://console.firebase.google.com/ and create a Project.
No need to enable Firebase Analytics.

Look for a button that sounds like "Add Firebase to your web app", it's
a wizard to generate your credentials.

By the way, if you're concerned with remote deploys,
mark "Also set up Firebase Hosting for this app."

Stop when you see a config JSON, you'll need it for the next step.

## Local setup (Node)

Using **Node 18**, just install dependencies:

```sh
npm i
```

Create a safe environment variables for you called `.env` using the `sample.env`:

```sh
cp sample.env .env
```

Fill it with the data you gathered earlier in the Firebase step.

And run the app:

```sh
npm run dev
```
