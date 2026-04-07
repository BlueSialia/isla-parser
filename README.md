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
