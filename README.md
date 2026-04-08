# Isla Parser

This is a home test from Isla.

## Objective

Extract data out of plain-text messages like the following:

```
MSG|^~\&|SenderSystem|Location|ReceiverSystem|Location|20230502112233||DATA^TYPE|123456|P|2.5
EVT|TYPE|20230502112233
PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|
DET|1|I|^^MainDepartment^101^Room 1|Common Cold
```

And describe how to structure a full application around the previous functionality.

## Progress

1. Start with a modern template for a Typescript library. I like bgub/ts-base because it's simple.
2. Implement a pipeline of parse, extract, deserialize with validation and format to desired output.
3. Add an initial battery of tests to ensure the implementation works correctly.
4. Rethink what is tested and what is missing and improve things here and there.
5. Document main functions because I forgot to do it between steps 2 and 3.

## Structure of full application

For a production API based on this parsing functionality I would use the well-known 4 layer structure consisting in:

1. Presentation Layer. Responsible for handling HTTP requests/responses, input validation and mapping of internal errors to HTTP responses. It's commonly made of `Controllers`.
2. Application Layer. Responsible for the bussiness logic and using the remaining two layers. Defines the operations the API can perform. This library would be used in here. Or, if this repo where to be converted in the API instead, evverything but the `Patient.ts` file would be here. It's commonly made of `Services`.
3. Domain Layer. Responsible for defining all the internal entities/models. It should be as independent from the other layers and any framework used in them as possible.
4. Infrastructure Layer. Responsible of connecting the API with other services. The most common thing would be databases and any other service if this API is part of a distributed system that must comunicate with the others in the sytem. And also any third party service if we want to send an email, make or request a payment, etc. It's commonly made of `Repositories` and `Drivers`.

The current error would map directly to HTTP errors. Parsing errors are 400 and Validation errors are 422. Any application errors resulting for bug in the orchestration of the layer would be 500.

Scalability is straightforward as simply parsing messages as a functionality doesn't have much complexity. In order to handle increasing ammounts of requests this API can be instanciated as many times as required and placed behind a load balancer. And if we have to deal with potentially massive messages that take a considerable ammount of time to parse we can switch from injesting the messages from a queue instead of directly.
