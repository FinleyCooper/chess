# offical python base image
FROM python:3.11.2-slim-bullseye

# set work directory
WORKDIR /backend

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PROD_PRIVATE_KEY 40140628413216081582169698275426106798779573665835223536410298104307380633135

# install dependancies
RUN pip install --upgrade pip
COPY ./requirements.txt /backend
RUN pip install -r ./requirements.txt

# copy project
COPY . ./

# start gunicorn
EXPOSE 5000
CMD ["gunicorn", "-b", ":5000", "app:app"]