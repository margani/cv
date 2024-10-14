# My CV

This repo generates my CV into HTML and PDF.

## Build

`npm run build`

## Run

`npm run demo`

## Latest CV

My latest CV is available to download [here](https://raw.githubusercontent.com/margani/cv/main/latest/Hossein-Margani-CV.pdf).

## How to reuse this repository

1. Clone this repository on your local:

```sh
git clone git@github.com:margani/cv.git
```

2. While on main branch, unset the upstream and remove the remotes:

```sh
git branch --unset-upstream
git remote remove origin
```

Now you have a copy of this repository on your local that has no relation to this github repository.

3. Modify `cv.json` to match your own resume. Change `output.fileName` attribute to your desired file name for the result PDF. For example `my-cv.pdf`.
4. Update `README.md` file to point to the new `output.fileName` that you specified.
5. (optional) Modify `cv.njk` to match your resume style.

6. Create a new repository in GitHub. Assuming the SSH URL is: `git@github.com:<your username>/<your repository name>.git`, set the remote:

```sh
git remote add origin git@github.com:<your username>/<your repository name>.git
```

for example if `jane` has created a repository named `resume`, the command will be:

```sh
git remote add origin git@github.com:jane/resume.git
```

6. Now you can push the changes:

```sh
git push origin main
```

7. As soon as you push your changes now, or in the future, the GitHub action will run, and creates the PDF file in `latest` folder. Direct URL to your resume will be `https://raw.githubusercontent.com/<your username>/<your repository name>/main/latest/<the value of output.fileName>`. For example for `jane`'s `resume` repository, who has set the `output.fileName` to be `my-cv.pdf`, it will be `https://raw.githubusercontent.com/jane/resume/main/latest/my-cv.pdf`. You can use this URL to send to recruiters, update this README.md file in your repository, etc.
