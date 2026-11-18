# Allegheny County Behavioral Health Provider Directory (v0.1.0)

This directory covers mental health and substance use providers that call-center staff can refer clients to. It was compiled on November 18, 2026 from public sources and is meant for the ASC prototype. Confirm openings, hours and eligibility with a provider before referring.

## Files

- `bh-providers.json`: the directory. It validates against the schema.
- `bh-providers.schema.json`: the JSON Schema (draft 2020-12).
- `bh-provider-services.csv`: the same data flattened, one row per service at each site, for spreadsheets.

## What's in it

| | Count |
|---|---|
| Providers | 89 |
| Facilities | 162 (139 in Allegheny County) |
| Service listings | 301 |
| Hotlines and 24/7 lines | 24 |
| Sources | 29 |

The directory covers:
- crisis and access points (resolve, Pathway to Care and Recovery, IRES)
- hospitals designated for emergency psychiatric exams, and their inpatient units
- community mental health agencies and child and family agencies, including IBHS
- drug and alcohol treatment at every level of care, including methadone and buprenorphine
- peer, family and advocacy organizations, clubhouses and drop-in centers
- mental health housing
- services for specific groups: LGBTQ+, survivors of violence, immigrants and refugees, Deaf and hard of hearing, and veterans

Out-of-county residential programs are included only when the county's directory lists them for Allegheny County residents. They are marked `inAlleghenyCounty: false`.

## How it's organized

```
meta            title, scope, warning, gaps, counts
vocabularies    services (73, each with a category), populations, funding, providerTypes
sources         every source, with URL and as-of date
hotlines        crisis and help lines, linked to a provider where there is one
changes         closures and changes since the county's February 2025 booklet
providers[]
  id, name, aka, operator, type, website, phones{}
  serves        { ageGroups[], populations[] }   who the provider serves overall
  limitations[] eligibility limits, e.g. "Veterans only", "Ages 14 and older"
  referral      e.g. "Referral only", "No referral needed"
  funding[]     only when a source states it
  facilities[]  { id, name, address, county, inAlleghenyCounty, phone, status, notes, flags[] }
  services[]    { service, facilities[], ageGroups[], populations[], minAge, maxAge, phone, notes, limitations[] }
  flags[]       conflicts between sources or things to double-check
  sources[], verification { level, checkedOn }
```

To answer "who offers X for Y near Z":
1. Filter `providers[].services[]` by `service` and by `ageGroups` or `populations`.
2. Look up each listed facility id in that provider's `facilities` to get its address.

Each service is tied to specific facilities. An empty `facilities` list means the provider offers the service but no source confirmed where. The worker should call the provider's main number.

**Verification levels:**
- `county-directory`: from the county's 2025–2027 *Where to Call* booklet (current as of February 2025).
- `provider-site`: checked on the provider's own website.
- `multiple`: both.

Facilities with `status: "verify"` are offices a source names without an address.

## Changes since the county booklet

- **Heritage Valley Kennedy:** closed its adult and geriatric psychiatric units in June 2025. It's no longer an emergency psychiatric exam site.
- **AHN Allegheny Valley Hospital:** its psychiatric unit now serves only people 60 and older.
- **Heritage Valley and Staunton Clinic:** Heritage Valley, and with it Staunton Clinic, is now part of AHN.
- **Emergency psychiatric exam sites:** the county's current list adds UPMC Presbyterian and UPMC Shadyside.
- **Pittsburgh Mercy:** runs a 24/7 walk-in crisis center at 264 South 9th Street.
- **Gateway Fox Chapel:** this office is no longer on Gateway's location list.
- **Affiliations:** Familylinks with Life'sWork (2026), and Wesley with Transitional Services (2025).

## Known gaps (next pass)

- Private practices and individual therapists.
- Federally qualified health centers with integrated behavioral health.
- Office-based buprenorphine prescribers and other methadone clinics.
- Insurance accepted by each provider. Community Care's online directory is the source of truth for HealthChoices.
- Hours for most sites.
- Addresses for the 14 offices marked `verify`.

"CHBH" in the request was read as Community Care Behavioral Health (CCBH), the county's Medicaid behavioral health plan. Its provider search is dynamic and wasn't scraped. Pulling from it, or from 211's database by agreement, is the best way to fill the gaps.
