# POC: Appointments with Vonage AI

A proof of concept using Vonage AI for appointments.

## Firebase (BaaS)

It relies on Firebase as backend even for local development,
so we have a vendor lock-in, but that's fine for a quick POC.
Get ready to
[press some buttons here](http://www.quickmeme.com/img/99/9903c7c14add3fd0758b7b5b80c24d48101f296f13ce34736799a82c71f61bc2.jpg).
But don't worry, all sensitive details are automated, you're just initializing the resources.

So open https://console.firebase.google.com/ and create a Project.
No need to enable Analytics.

First, enable the database, look for a "Firestore Database" section and create it.
Select the "test mode" while creating it for now.

Now, for the credentials. Look for a button that sounds like "Add Firebase to your web app",
it's a wizard to generate your credentials.

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

## Deploying it (PaaS)

Just for clarifications, we'll need from this Cloud:

- Firestore
- Functions
- Hosting

This might require you to put billing data, but you should not be charged
since there's no way a simple proof of concept could exceed the no-charge
limit, it's huge. Just remember to delete everything after any
so nobody can abuse its usage.

TLDR, the commands are:

```sh
npm install -g firebase-tools
firebase login
npm run deploy
```

If you're maintaining a custom instance (made by someone else than the original repo author),
you'll probably need to somehow override the project name used as target.

After the deploy finishes, look in the output for the console link to manage
these resources, but you'll be mostly interested in the other links for the
hosted app and for the hosted function. You can open the hosted app in your browser
while the serverless function will be used as web hook for the Vonage Agent.

## Vonage AI Studio (the rescheduling)

Create an Vonage AI Studio account for you and create an Agent which is how
they call a programmed flow of conversation.

When you be prompted to Import an Agent, use the file available here
in this repository called "appointment-agent". Remember to update the
hook step with the actual cloud function URL.

In case you have to assemble something by yourself for any reason
(like the importation not working), you must create one for yourself from
scretch. Just pick any steps you want to feel the variables, but concerning this
integration the web hook step is what that matters most. It must be a POST to
the serverless function with the following format, a valid JSON:

`{ "phone": "$PHONE", "date": "$DATE", "time": "$TIME" }`

Assuming that the variables are the ones named with the `$` prefix, that should
work. And they're typed in Vonage as `sys.phone_number`, `sys.date` and `sys.time`.
For voice, you can add an assignment step saying that `PHONE = $CALLER_PHONE_NUMBER`,
cause this later variable is injected by Vonage during a telephony call. This also
means that, for the scope of this POC, you must go to the Firestore console and edit
one of the guardian numbers to a real phone of yours, so the cloud function will
identify you as such guardian for the rescheduling process. Remember to use your
phone in the international format, with your country and area codes.

## Licensing

This is proprietary software made by WebRTC.ventures & AgilityFeat and written by
their favorite developer Marcell da Silva (Mazuh).
