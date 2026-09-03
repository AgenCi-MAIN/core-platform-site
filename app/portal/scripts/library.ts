/**
 * THRIVE call script vault — imported from the canonical script document.
 *
 * CONTENT RULE — this is the whole point of this file.
 *
 * Script text is HUMAN-AUTHORED AND HUMAN-OWNED. AI must never write, rewrite,
 * reword, shorten, "improve", summarise, or generate any value of the `body`
 * field. Presentation is free to change; the words agents say on a live call
 * are not. If a script needs changing, a human changes it in the canonical
 * document and re-imports it, recording the revision.
 *
 * Every `body` below is the verbatim text export of the canonical Google Doc
 * (SCRIPT_VAULT_SOURCE), one entry per top-level tab, in document order. The
 * only transformation applied is decoding the backslash escapes the Markdown
 * export added (\_ \[ \] \* \# \> \!) — they are not in the source. Leading and
 * trailing blank lines were trimmed from each tab; interior lines, spacing,
 * typos, and glyph artifacts are preserved exactly as exported.
 *
 * Imported 2026-09-02.
 *
 * STATUS — every entry is DRAFT, pending licensed and compliance review. This
 * is NOT approved guidance. Nothing in this file activates calling, selling,
 * claims handling, policy replacement, or cancellation; it is a reference copy
 * held for review.
 */

export const SCRIPT_VAULT_SOURCE = {
  title: "my script",
  documentId: "1vV2_B6xix29g-k-IVpXZR5AcTcyjhjlx4S-tJca97WE",
  url: "https://docs.google.com/document/d/1vV2_B6xix29g-k-IVpXZR5AcTcyjhjlx4S-tJca97WE",
  importedOn: "2026-09-02",
} as const;

export type ScriptPhase =
  | "Inbound Call Process"
  | "Post Hold Process"
  | "Application Process";

export type CallScript = {
  /** Stable id (kebab-case of the title), used as the React key and anchor. */
  id: string;
  /** 1-based position in the canonical document. */
  order: number;
  /** Tab title as it appears in the canonical document. */
  title: string;
  /** Section of the call process the tab belongs to. */
  phase: ScriptPhase;
  /** Review state. Every imported entry is a draft pending review. */
  status: "draft_compliance_review";
  /** Exact tab title in the source document. */
  sourceTab: string;
  /** Verbatim export of the tab. NEVER AI-authored or AI-edited. */
  body: string;
};

export const SCRIPT_STATUS_LABELS: Record<CallScript["status"], string> = {
  draft_compliance_review: "DRAFT / LICENSED AND COMPLIANCE REVIEW REQUIRED",
};

export const CALL_SCRIPTS: readonly CallScript[] = [
  {
    id: "direct-carrier-question-intro",
    order: 1,
    title: "Direct Carrier Question Intro",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Direct Carrier Question Intro",
    body: ` **Inbound Call Process — Variation 1**

*Direct Carrier Question Introduction | Phase 1: Full Verification & Policy Snapshot*

  

**STEP 0 — Phone Answer**

SCRIPT:  
“Thank you for calling in, this is ___, how can I help you?”

                          Holding

*PURPOSE:**  
**Establishes professionalism, neutral authority, and immediate control.*

**STEP 1 — Carrier Question**

If the caller asks: “Is this ___ Insurance?”  
  
SCRIPT:  
“That’s a carrier I can help you with. Do you have your policy number?”  
  
 If YES: rfect — g“Peo ahead.”  
 If NO: “No problem, I can verify you a different way.”  
  
*PURPOSE:**  
**Handles the direct carrier question while maintaining authority and moving the call into verification.*

 

**STEP 2 — Begin Verification (Use the Word VERIFY)**

SCRIPT:  
  
“***Verify*** your first and last name?” → “Could you spell that for me.” -> “Perfect”  
“***Verify*** your date of birth?” -> “Perfect”  
  
*PURPOSE:**  
**Using the word 'verify' reinforces legitimacy. Saying 'Perfect' confirms completion and maintains authority.*

 

**STEP 3 — Reason for Call**

SCRIPT:

“What can I help you with today?”

  

After they explain:  
“Okay ___, I can definitely help you with that. I just need to verify a few more pieces of information.”  
  
*PURPOSE:**  
**Acknowledges their concern, builds trust, and gains cooperation before financial verification.*

  

**STEP 4 — Policy Snapshot Verification (7 Required Pieces)**

You must VERIFY all 7:  
 • Name (spelled)  
 • Date of Birth  
 • Insurance Carrier -> ***Be careful not to ask if they already stated the company***  
 • Problem / Reason for Call  
 • Monthly Premium  
 • Coverage Amount  
 • Policy Duration  
  
**Monthly Premium:**  
“Go ahead and **verify** your monthly premium for me.” → “Perfect.”  
  
If client is unsure:  
“Do you have a recent bank statement we can **verify** that from?”  
If not:  
“Is it more like under $50 a month or over $100?”  
  
**Coverage Amount:****  
**“Go ahead and **verify** your coverage amount for me.” → “Perfect.”  
  
If client is unsure (Range Narrowing Technique):  
“Do you remember if it’s more like $5,000 or $10,000?”  
 If not:  
“Or is it more like $100,000 or $200,000?”  
  
**Policy Duration:****  
**“Just so I can get this pulled up a bit easier — about how long have you had it?” → “**Perfect**.”

  
  
  

Additional Policies:

“And I don’t want to get confused when pulling up your info, but do you have any other existing life insurance with any other companies?”

If Yes, get carrier, monthly premium, coverage amount, and how long ago.

If not, move on to Step 5.

  
*PURPOSE:**  
**The goal is categorization, not exact math. Identify policy type and size. Small range (5k–20k) likely Final Expense. Mid range (50k–150k) likely Term. Higher range (200k+) larger coverage. Always maintain calm, analytical authority.*

 

**STEP 5 — Hold Transition**

SCRIPT:  
“Alright **[CLIENT NAME]**, I can definitely help you out with **[Re-address the problem]**. I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an **[859] #.** That’s my direct line, just so you don’t have to start over with someone else. Again, this is **[YOUR NAME]**, I’m here to help. I’ll be right back. I just need about 2-3 minutes.”  
  
*PURPOSE:**  
**Creates professionalism and legitimacy. Allows reset before the analysis phase.*

**CORE RULES**

• Always use the word '**verify**'.  
• Always confirm answers with '**Perfect**.'  
• Do **NOT** sell during Phase 1.  
• Follow the order!  
• If the client does not know numbers, narrow the range — do not guess.

**END STATE**

The client believes you are reviewing their policy.  
The agent has verified all 7 required data points and understands approximate policy type and size.`,
  },
  {
    id: "client-states-problem-first-intro",
    order: 2,
    title: "Client States Problem First Intro",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Client States Problem First Intro",
    body: `**Inbound Call Process — Client States Problem First**

 

“Thank you for calling in, this is ___, how can I help you?”

                           Holding              

**STEP 1 — Client Explains Problem**

  
“Okay, so you're calling because [RESTATE THE ORIGINAL PROBLEM]. I can definitely help you with that. I just need to verify some information first.”  
  
**STEP 2 — Begin Verification**

  
  

Can you spell out your first and last name for me?  
  
“**Verify** your date of birth?” → “Perfect.”  
  
**STEP 3 — Identify Insurance Carrier**

  
  

“And just so I don't mix it up with anything else in our system — we do work with multiple companies — which company do you have the policy with?”

“Perfect.”   
 

**STEP 4 — Policy Snapshot Verification (7 Required Pieces)**  
  
Monthly Premium:  
“Go ahead and **verify** your monthly premium for me.” → “Perfect.”  
  
If client is unsure:  
“Do you have a recent bank statement we can verify that from?”  
  
If still unsure:  
“Is it more like under $50 a month or over $100?”

**Coverage Verification**

SCRIPT:  
“Go ahead and **verify** your coverage amount for me.” → “Perfect.”  
  
If they do not know:  
“Do you remember if it’s more like $5,000 or $10,000?”  
  
If not:  
“Or is it more like $100,000 or $200,000?”  
  

**Policy Duration**

  
“Just so I can get it pulled up easier — about how long have you had it?” → “Perfect.”

**Additional Policies:**

“And just for my notes — is this the only policy you have with us, or do you have any other life insurance through any other companies?”

If Yes, get carrier, monthly premium, coverage amount, and how long ago.

If not, move on to Step 5.

**STEP 5 — Hold Transition**

SCRIPT:  
“Alright ___, I can definitely help you out with (re-address the problem). I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an **[859] #.** That’s my direct line, just so you don’t have to start over with someone else. Again, my name is [**YOUR NAME**], I’ll be right back. I just need about 2-3 minutes.”  `,
  },
  {
    id: "death-claim-discovery-intro",
    order: 3,
    title: "Death Claim Discovery Intro",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Death Claim Discovery Intro",
    body: `**Death Claim Discovery Intro**

*Inbound Call Process — Death Claim Verification & Caller Policy Discovery*

 

**STEP 0 — Phone Answer**

SCRIPT:  
 “Thank you for calling in, this is ___, how can I help you?”  
  
*PURPOSE:**  
**Professional greeting that allows the caller to explain the situation.*

 

**STEP 1 — Caller Explains Death Claim**

Common examples of how callers begin the conversation:  
 • “I need to file a death claim.”  
 • “My husband passed away and I need to report it.”  
 • “I'm calling about a life insurance claim.”  
  
SCRIPT RESPONSE:  
“I’m very sorry to hear that. I can help you with that, I just need to verify some information first.”  
  
*PURPOSE:**  
**Acknowledges the situation respectfully while transitioning into verification.*

 

**STEP 2 — Verify Deceased (Proposed Insured)**

SCRIPT:  
“First, go ahead and verify the first and last name of the insured for me.” → “Perfect.”  
  
*PURPOSE:**  
**Identifies the deceased policy holder so the correct policy can be located.*

 

**STEP 3 — Verify Caller Information**

SCRIPT:

“And since you're the one calling in, I need your first and last name and date of birth as well.”

  
  
*PURPOSE:**  
**Documents the identity of the person reporting the death and establishes who the agent is speaking with.*

 

**STEP 4 — Verify Insurance Carrier**

SCRIPT:  
“We oversee 30 different insurance companies now, which one is the policy set up through?”→ “Perfect.”  
  
*PURPOSE:**  
**The carrier must be verified before moving forward to avoid confusion between policies.*

 

**STEP 5 — Beneficiary Verification**

SCRIPT:  
“Are you the beneficiary of this policy?”  
  
*PURPOSE:**  
**Determines the caller’s role in the claim process and how the conversation should proceed.*

 

**STEP 6 — Beneficiary = YES or MAYBE**

SCRIPT:

“Okay, like I mentioned, we oversee 30 different insurance companies, and since you might be tied to the policy, I don’t want to get anything confused when I get everything pulled up.”

  

“Do you hold any life insurance with this company, or have any active life insurance with any other companies?”

  
  

**If they do have life insurance:**

  

“Okay perfect, the reason I ask is because I just want to make sure we don’t accidentally file the wrong claim when I get everything pulled up.”

“All I need to get everything aligned is your monthly premium, your coverage amount, and the number of years you’ve had it.” → “Perfect.”

  
  
  
  

**STEP 7 — Hold Transition**

SCRIPT:  
“Alright ___, I can definitely help you out with (re-address the problem). I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an **[859] #.** That’s my direct line, just so you don’t have to start over with someone else. Again, my name is [**YOUR NAME**], I’ll be right back. I just need about 2-3 minutes.”  
  
*PURPOSE:**  
**Creates professionalism and prepares the agent to review the policy information.*`,
  },
  {
    id: "non-life-discovery-intro",
    order: 4,
    title: "Non life Discovery Intro",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Non life Discovery Intro",
    body: `**Non-Life Insurance Discovery Intro**

*Inbound Call Process — Non-Life Insurance Verification & Life Insurance Discovery*

 

**STEP 0 — Phone Answer**

SCRIPT:  
“Thank you for calling in, this is ___, how can I help you?”  
  
*PURPOSE:**  
**Professional greeting that allows the caller to explain their situation.*

 

**STEP 1 — Caller Explains Issue**

Common examples of how callers begin the conversation:  
 • “I'm calling about my auto insurance.”  
 • “I need help with my homeowners policy.”  
 • “I'm calling about my health insurance.”  
 • “I have a question about another type of insurance.”  
  
 SCRIPT RESPONSE:  
 “Okay, I can definitely help you with that. I just need to verify a couple pieces of information first.”  
  
*PURPOSE:**  
**Maintains authority and keeps the caller within the verification process.*

 

**STEP 2 — Verify Insurance Carrier**

SCRIPT:  
“We oversee 30 different insurance companies now. Which company is that policy set up through?”  
→ “Perfect.”  
  
*PURPOSE:**  
**Identifies the carrier associated with the policy the caller believes they are calling about.*

 

  
  

**STEP 3 — Verify Name and Caller Date of Birth**

SCRIPT:

“Can you go ahead and verify your first and last name” “Spell that for me” ->”Perfect”

  

“Go ahead and verify your date of birth for me.” → “Perfect.”

*PURPOSE:**  
**Confirms the caller’s identity so the policy can be located.*

 

**STEP 4 — Life Insurance Discovery**

SCRIPT:  
“Like I mentioned we do oversee 30 insurance companies, do you happen to have any other insurance you are paying on just so I don’t get any files confused? Such as any life insurance? Or health?”  
  
 → “Perfect.”  
  
*PURPOSE:**  
**Discovers whether the caller currently has life insurance or other policies while maintaining the context of verifying files.*

 

**STEP 5 — If Caller HAS Life Insurance**

SCRIPT:  
“Okay perfect, I just want to make sure I don’t get any files confused when I get everything pulled up.”

“All I need to get everything aligned is your monthly premium, your coverage amount, and the number of years you’ve had it.” → “Perfect.”

*PURPOSE:**  
**Allows the agent to gather a snapshot of the caller’s life insurance policy.*

**STEP 6— Hold Transition**

SCRIPT:  
“Alright ___, I can definitely help you out with (re-address the problem). I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an **[859] #.** That’s my direct line, just so you don’t have to start over with someone else. Again, my name is [**YOUR NAME**], I’ll be right back. I just need about 2-3 minutes.”  
*PURPOSE:**  
**Creates professionalism and prepares the agent for the next phase of the call.*

 

**INFORMATION COLLECTED DURING THIS INTRO**

• Insurance Carrier  
• Caller Date of Birth  
• Confirmation of other active insurance  
• Life Insurance Carrier (if applicable)  
• Life Insurance Coverage  
• Life Insurance Premium  
• Life Insurance Policy Duration

 

**END STATE**

The caller believes the agent is pulling up their policy to assist with their issue while the agent has also identified and verified the caller’s life insurance information.`,
  },
  {
    id: "cancelation-intro",
    order: 5,
    title: "Cancelation intro",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Cancelation intro",
    body: `**Cancellation Intro**

*Inbound Call Process — Policy Cancellation / Cash Out Verification (with Replacement Paperwork)*

 

**STEP 0 — Phone Answer**

SCRIPT:  
“Thank you for calling in, this is ___, how can I help you?”  
  
*PURPOSE:**  
**Professional greeting that allows the caller to explain their situation.*

**STEP 1 — Caller Requests Cancellation / Cash Out**

Common examples:  
 • “I want to cancel my policy.”  
 • “I want to cash out my life insurance.”  
 • “I need to stop my policy.”  
  
SCRIPT:

“Okay, I can definitely help you with that. I just need to verify some information first.”  
  
*PURPOSE:**  
**Moves the conversation into the verification process.*

**STEP 2 — Verify Name**

SCRIPT:  
“Go ahead and verify your first and last name for me.” → “Perfect.”  
  
*PURPOSE:**  
**Identify the caller so the correct policy can be located.*

**STEP 3 — Verify Date of Birth**

SCRIPT:  
“Go ahead and verify your date of birth.” → “Perfect.”  
  
*PURPOSE:**  
**Confirm the caller’s identity.*

 

  

**STEP 4 — Cancellation Reason (Before Premium/Coverage/Duration)**

SCRIPT:  
“Just for my notes, what is the reason for cancellation?”  
  

Prompt if needed:  
“Is it too expensive, or did you set up something else?”  
  
*PURPOSE:**  
**Document the reason and route to the correct next step.*

**STEP 5A — If Reason = Too Expensive**

SCRIPT:  
“Go ahead and verify the insurance company your policy is set up through.” → “Perfect.”  
“Go ahead and verify your monthly premium.” → “Perfect.”  
“Go ahead and verify your coverage amount.” → “Perfect.”  
“And about how long have you had the policy?” → “Perfect.”  
  
*PURPOSE:**  
**Collect current policy snapshot before proceeding.*

 **STEP 5B — If Reason = Set Up Something Else (Replacement Paperwork)**

SCRIPT:  
“Okay — so the state does require replacement paperwork for when we cancel.”  
“Go ahead and verify the new company you have it through.” → “Perfect.”  
“Go ahead and verify your coverage amount.” → “Perfect.”  
“Go ahead and verify your monthly premium.” → “Perfect.”  
“And about how long have you had the policy?” → “Perfect.”  
  
*PURPOSE:**  
**Extract the new policy information for replacement paperwork.*

**STEP 6 — Hold Transition**

SCRIPT:  
“Alright ___, I can definitely help you out with (re-address the problem). I just need to put you on a brief hold while I get everything pulled up on my end. And just in case we get disconnected, I will call you back from an **[859] #.** That’s my direct line, just so you don’t have to start over with someone else. Again, my name is [**YOUR NAME**], I’ll be right back. I just need about 2-3 minutes.”  
*PURPOSE:**  
**Prepare for the next stage of the call.*

 

**END STATE**

Agent has documented the cancellation reason and verified either the current policy snapshot or (if replacement) the new policy details needed for paperwork.`,
  },
  {
    id: "quote-shopper-intro-for-cs-calls",
    order: 6,
    title: "Quote Shopper Intro for CS calls",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Quote Shopper Intro for CS calls",
    body: `**Inbound Call Process — Quote Shopper Intro**

Client Calling for Quotes | Phase 1: Verification, Discovery & Qualification

 

**STEP 0 — Phone Answer**

SCRIPT:

“Thank you for calling in, this is ___, how can I help you?”

*PURPOSE:*

*Professional greeting that allows the caller to explain their reason for calling.*

**STEP 1 — Client Requests Quote**

The caller will normally say something like:

• “I’m calling to get a life insurance quote.”

• “I’m looking for a quote through (company name).”

• “I want to see what (insurance company) offers.”

SCRIPT RESPONSE:

“Okay perfect, I can definitely help you with that.”

“I just need to verify a couple pieces of information first.”

*PURPOSE:*

*Keeps the call structured and establishes authority before moving forward.*

 

**STEP 2 — Begin Verification**

SCRIPT:

“What’s your first and last name?”

“Go ahead and spell that for me.” → “Perfect.”

“What’s your date of birth?” → “Perfect.”

“Which company were you looking to get a quote through?” → “Perfect.”

*PURPOSE:*

*Confirms the caller’s identity and identifies the company they are interested in.*

 

**STEP 3 — Motivation Discovery**

SCRIPT:

“Just so I understand — what made you start looking into life insurance today?”

Follow up questions may include:

• “Did something recently happen?”

• “Is there a reason you haven’t already set something up before?”

*PURPOSE:*

*Identifies the caller’s motivation and urgency for purchasing life insurance.*

 

**STEP 4 — Existing Policy Discovery**

SCRIPT:

“Do you currently have any life insurance in place right now?”

If yes:

“Perfect, some companies actually offer discounts if you already have coverage.”

*PURPOSE:*

*Determines whether the caller already has life insurance that may need to be improved, expanded, or replaced.*

 

**STEP 5 — Verify Current Policy (If Applicable)**

If the caller confirms they have a policy, verify the following in order:

Monthly Premium:

“Go ahead and verify your monthly premium for me.” → “Perfect.”

Coverage Amount:

“Go ahead and verify your coverage amount for me.” → “Perfect.”

Policy Duration:

“About how long have you had the policy?” → “Perfect.”

Insurance Company:

“Which company is that policy through?” → “Perfect.”

*PURPOSE:*

*Allows the agent to understand the caller’s current coverage and identify improvement opportunities.*

 

**STEP 6 — Brokerage Positioning**

SCRIPT:

“So ___, we are actually a life insurance brokerage, meaning we oversee 35 different life insurance companies on our end. That means we are able to see all the rates for different coverages in your state.”

“I will also take a look into the company you were calling about as well.”

“What exactly were you looking to set up and how much coverage were you looking for?”

*PURPOSE:*

*Positions the agent as a broker who can compare multiple companies while acknowledging the specific company the caller asked about.*

 

**STEP 7 — Coverage Goal Discovery**

SCRIPT:

“What exactly were you looking to accomplish with this coverage?”

*PURPOSE:*

*Identifies the client’s objective so the agent can recommend appropriate coverage.*

***Examples*** *- burial/cremation, final expenses, mortgage, leave behind a legacy*

 

**STEP 8 — Basic Health Qualification**

SCRIPT:

“Life insurance is mainly based on your age and health.”

“So I just need to ask — do you currently have any major medical issues?” → “Perfect.”

*PURPOSE:*

*Helps determine eligibility and identify which companies may offer the best options.*

 

**STEP 9 — Budget Qualification**

SCRIPT:

“The last thing that would help is a general budget you were looking to be around.”

“I just want to make sure I’m looking for comfortable options for you.”

*If they do not give a number:*

“Would something around $100 be too much? Or less or more?”

*PURPOSE:*

*Identifies the client’s monthly budget and allows the agent to go into the hold phase with clear expectations and ammunition for the recommendation.*

 

**STEP 10 — Hold Transition**

SCRIPT:

“Perfect, I have all the information I need.”

“I’m going to take a look at all the companies on our end and see what we’re working with.”

“I just need to put you on a brief hold while I pull everything up for you. And again, my name is **[YOUR NAME]**. I’m going to help you out here and just in case we get disconnected, I will give you a call back from my direct line, starting with **[YOUR AREA CODE],** that way you don’t have to start over with someone else. I just need about 2-3 minutes. I’ll be right back, ok.”

*PURPOSE:*

*Transitions the call from information gathering to policy analysis and preparation for the recommendation.*`,
  },
  {
    id: "intro-tips-and-tricks",
    order: 7,
    title: "Intro Tips and Tricks",
    phase: "Inbound Call Process",
    status: "draft_compliance_review",
    sourceTab: "Intro Tips and Tricks",
    body: `**Intro Tips & Tricks**

Inbound Call Process — Introduction Techniques

 

STEP — Banking Discovery Opportunity

When to use:

When the caller's problem directly relates to billing changes or regarding a payment. 

Examples: 

“I am calling to make a payment.”

“I’m calling to change my payment”

“I’m calling to see why my payment has not gone through”

  

SCRIPT:

“Okay, and is this set up on a recurring draft date?”

If the caller says no:

“Okay, is there a reason you haven't automatically set that up for recurring payments automatically out of your bank account? Sometimes they offer discounts.”

PURPOSE:

This question helps determine the client’s payment setup early in the call.

The agent is trying to identify:

• Whether the client has a bank account

• Whether the client uses a debit card only

• Whether the client mails payments

• Whether there is another reason recurring drafts are not set up

Many insurance applications require bank draft payments, so identifying this information early prevents problems later in the call.

This question gathers the information without creating skepticism from the caller.

 

**STEP — Additional Policy Discovery**

Anytime a caller is making changes to their life insurance policy, it creates an opportunity to determine whether they have additional life insurance coverage with another carrier.

Examples include:

• Beneficiary changes

• Address updates

• Banking updates

• Billing questions

• Any other policy change request

SCRIPT:

“Okay, and we actually oversee 30 different insurance companies now. Do you happen to have any other active life insurance with any other company that needs changed as well? I might be able to help with that.”

If the caller confirms another policy:

“Yep, I can definitely help you out with that one as well. Just need to verify the information on that.”

PURPOSE:

This question identifies whether the caller has other life insurance policies.

The agent gathers:

• Additional carriers

• Additional policies

• Information needed for potential consolidation

By gathering this information early, the agent is positioned to conduct a full policy review later in the call.`,
  },
  {
    id: "standard-to-preferred",
    order: 8,
    title: "Standard To Preferred",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Standard To Preferred",
    body: `**Standard to Preferred Angle** 

**STEP 1 — Reassure the Original Problem**

“Alright ___, are you still with me? → “Perfect.”

“Definitely going to help you out with ______ so that way you know exactly what is going on moving forward.” 

**STEP 2 — Create Confusion & Concern**:

“But I’m seeing some confusing and concerning things on my end.”

“Has it been awhile since you last talked to an agent?”

→ Listen to response

“When you took out this policy did you have any major health concerns?”

Use reactions:

• “Really none?”

• “Oh that's it?”

• “Only that?”

“Nothing like heart attack, cancer, stroke, diabetes, or anything with your kidneys, liver, lungs, heart?”

*Wait for client response*

**STEP 3 — Insert the Angle (Standard → Preferred)**

“Were you aware that you were in a standard policy when it sounds like you should actually be in the preferred?”

“You’re in the type of policy meant for really unhealthy people. When it sounds to me that you are healthy and should be with one of our healthy partners.”

Follow up:

“It actually looks like one of our other partner companies like (Carrier Name) would have gotten you into the healthy category, and would have given you more coverage for your family for around the exact same price.”

**STEP 4 — Assign Responsibility**:

“It looks like they were trying to reach out to you to get that fixed.”

“Why in the world did you not do that when you had the chance?” 

**STEP 5 — Align With the Client (Coddling Stage)**

“Oh my gosh ___, I am so sorry this happened. Someone definitely dropped the ball here.”  

**STEP 6 — Assumption Agreement**

“Well ___, I’m assuming if you knew you could have been put in the right category and gotten more coverage for around the same price you probably would have done that right?”

→ Wait for response:

• “Absolutely”

• “Yes”

• “Definitely”

 **STEP 7 — Takeaway Close**

“Well since they sent it out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could go to war for you and reinstate what should have happened since you had no idea, AND help you with (reason they are calling) as well.”

# **STEP 8 — Verify Health and eApplication**

So as you’re probably aware, this will depend on your age and health, so I do need to ask you a few questions regarding your health….

  

  - Are you a smoker/non-smoker?
  - Any history of heart attack, cancer, stroke or diabetes?
      
      - If yes to any of these, ask more follow up questions, such as:
      - When was the diagnosis? What type of cancer and date of last treatment? Was it a regular stroke or mini-stroke?
      - If yes to diabetes, when were you diagnosed? Any complications such as neuropathy, retinopathy or amputations? Oral medications, insulin or both? 
  - Any kidney/liver failure or disease? 
      
      - If yes to kidney failure/disease, ask those follow up questions. 
      - Any dialysis(kidney only)
  - Any asthma, COPD or emphysema? Any oxygen use?
  - Sleep Apnea? 
      
      - If yes, do you use a C-PAP machine?
  - Arthritis?
      
      - Is it osteo or rheumatoid?
  - Any thyroid issues?
      
      - Is it hypo or hyper? Diagnosis age? 
  - Any heart arrhythmia, or any other heart related conditions?
      
      - Pacemaker or defibrillator?
  - Hypertension or cholesterol issues?
      
      - If yes, how many medications for each?
  - Height/Weight?
      
      - If too skinny or too big, type height/weight in toolkit
  - Any DUI’s, felonies, probation or parole?
      
      - If yes, when?`,
  },
  {
    id: "term-to-perm",
    order: 9,
    title: "Term To perm",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Term To perm",
    body: `# **TERM TO PERM ANGLE**

Post Hold Process — Term Policy to Permanent Policy Angle

## **STEP 1 — Reassure the Original Problem**

**SCRIPT**

“Alright ___, are you still with me?”

→ “Perfect.”

“Definitely going to help you out with ______ so that way you know exactly what is going on moving forward.”

**PURPOSE**

This reassures the caller that their original reason for calling is still being handled before moving forward with the policy review.

## **STEP 2 — Create Curiosity & Concern**

**SCRIPT**

“But I'm seeing some confusing and concerning things on my end.”

“Has it been awhile since you last talked to an agent?”

→ Listen to the client's response

“When you took out this policy did you have any major health concerns?”

Use reactions:

• “Really none?”  
• “Oh that's it?”  
• “Only that?”

**PURPOSE**

This step captures the client's attention and creates curiosity so they are ready to listen to what the agent discovered.

## **STEP 3 — Insert the Angle (Term → Permanent)**

**SCRIPT**

“Were you aware that you are in a policy that will eventually expire, and your premiums will also start going up?”

→ Pause and listen.

Once the client says they were not aware, continue:

“It’s showing here one of our other partner companies like **(Carrier Name)** was reaching out trying to get you into a permanent policy. One that would guarantee a payout to your family no matter how or when you pass away, and also  keep your premiums level for the rest of your life. Nobody went over this with you?”

  

***PURPOSE***

*This reveals the issue with the client's current policy and introduces the benefit of permanent coverage.*

## **STEP 4 — Assign Responsibility**

**SCRIPT**

“It looks like they were trying to reach out to you to get that fixed.”

“Why in the world did you not do that when you had the chance?”

**PURPOSE**

This creates emotional engagement and urgency by showing that the policy issue could have been corrected earlier.

## **STEP 5 — Align With the Client (Coddling Stage)**

**SCRIPT**

“Oh my gosh ___, I am so sorry this happened. Someone definitely dropped the ball here.”

**PURPOSE**

This step aligns the agent with the client and shows empathy after the problem has been revealed.

## **STEP 6 — Assumption Agreement**

**SCRIPT**

“Well ___, I'm assuming if you knew you could have had something set up that would guarantee a payout to your family no matter how or when you pass away and keep your premiums level moving forward, you probably would have done that right?”

→ Wait for response:

• “Absolutely”  
• “Yes”  
• “Definitely”

**PURPOSE**

This gets the client to verbally agree that the permanent option would have been the better choice.

## **STEP 7 — Takeaway Close**

**SCRIPT**

“Well since they sent it out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could go to war for you and reinstate what should have happened since you had no idea, AND help you with (reason they are calling) as well.”

**PURPOSE**

This creates urgency and positions the agent as the client’s advocate while transitioning directly into the application process.

# **STEP 8 — Verify Health and eApplication**

So as you’re probably aware, this will depend on your age and health, so I do need to ask you a few questions regarding your health….

  

  - Are you a smoker/non-smoker?
  - Any history of heart attack, cancer, stroke or diabetes?
      
      - If yes to any of these, ask more follow up questions, such as:
      - When was the diagnosis? What type of cancer and date of last treatment? Was it a regular stroke or mini-stroke?
      - If yes to diabetes, when were you diagnosed? Any complications such as neuropathy, retinopathy or amputations? Oral medications, insulin or both? 
  - Any kidney/liver failure or disease? 
      
      - If yes to kidney failure/disease, ask those follow up questions. 
      - Any dialysis(kidney only)
  - Any asthma, COPD or emphysema? Any oxygen use?
  - Sleep Apnea? 
      
      - If yes, do you use a C-PAP machine?
  - Arthritis?
      
      - Is it osteo or rheumatoid?
  - Any thyroid issues?
      
      - Is it hypo or hyper? Diagnosis age? 
  - Any heart arrhythmia, or any other heart related conditions?
      
      - Pacemaker or defibrillator?
  - Hypertension or cholesterol issues?
      
      - If yes, how many medications for each?
  - Height/Weight?
      
      - If too skinny or too big, type height/weight in toolkit
  - Any DUI’s, felonies, probation or parole?
      
      - If yes, when?`,
  },
  {
    id: "cash-surrender",
    order: 10,
    title: "Cash Surrender",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Cash Surrender",
    body: `# **CASH SURRENDER ANGLE**

# **STEP 1 — Reassure the Original Problem**

# “Alright ___, are you still with me?” 

→ “Perfect.”

“Definitely going to help you out with ______ so that way you know exactly what is going on moving forward.” 

### **PURPOSE**

This reassures the caller that their original reason for calling is still being handled before moving forward with the policy review.

# **STEP 2 — Create Curiosity & Concern**

### SCRIPT

“But I'm seeing some confusing and concerning things on my end.”

“Has it been awhile since you last talked to an agent?”

→ Listen to the client’s response.

“When you took out this policy did you have any major health concerns?”

Nothing like heart attacks, stroke cancer, or diabides?

Use reactions:

• “Really none?”  
• “Oh that's it?”  
• “Only that?”

### **PURPOSE**

This step captures the client's attention and creates curiosity so they are ready to listen to what the agent discovered.

# **STEP 3 — Insert the Angle (Cash Surrender)**

### **SCRIPT**

“Were you aware that there is around **$___ built up inside of your policy that is actually your money?”**

**(pause 3 seconds)**

If you do not take out the money from your policy that you have built up, God forbid if you pass away, the insurance company keeps the money.

or

“If you do not take out the money from your policy that you have built up, the insurance company would actually take that money when you pass away. It does not go to your beneficiary.”

**(pause 3 seconds)**

“Nobody ever explained that to you?”

Once they say they had no idea, continue:

“It is actually showing here that **one of our preferred carriers like (Carrier Name)** has sent you an option to **surrender your current policy and take the money for yourself**, receive a **tax-free check for roughly $___**, and still continue to have your **life insurance in place to take care of your family.** 

**(pause 1 seconds)**

“It looks like they were trying to reach out to you to get that fixed.”

“Why in the world did you not do that when you had the chance?”

**(Let them speak)**

  

# **STEP 5 — Align With the Client (Coddling Stage)**

“It’s not your fault.     NAME  ( You did nothing wrong.) This should have been explained to you.”

“Someone definitely dropped the ball here.”

  

# **STEP 6 — Assumption Agreement**

“Well ***, I'm assuming if you knew you could have **received a tax-free check for around $*** and still kept your life insurance in place, you probably would have done that right?” 

→ Wait for response:

• “Absolutely”  
• “Yes”  
• “Definitely”

### **PURPOSE**

This gets the client to verbally agree that correcting the situation would have been the right decision.

# **STEP 7 — Takeaway Close**

“Well since they sent that out a long time ago ___, I’m not even sure they will still let you do it.”

“But let me see if I could (help you out with this) **go to bat for you** and reinstate what should have been explained to you by your previous agent since you had no idea, AND help you with (reason they are calling) as well.”

# **STEP 8 — Verify Health and eApplication**

“Alright, so I’m going to go ahead and open up the [CARRIER] application now. Should only take a few minutes…”

  

“Go ahead and verify your current street address.”

  

“So as you’re probably aware, this will depend on your age and health, so I do need to ask you a few questions regarding your health….”

  

  - Are you a smoker/non-smoker?
  - Any history of heart attack, cancer, stroke or diabetes?
      
      - If yes to any of these, ask more follow up questions, such as:
      - When was the diagnosis? What type of cancer and date of last treatment? Was it a regular stroke or mini-stroke?
      - If yes to diabetes, when were you diagnosed? Any complications such as neuropathy, retinopathy or amputations? Oral medications, insulin or both? 
  - Do you have any kidney/liver failure or disease? 
      
      - If yes to kidney failure/disease, ask those follow up questions. 
      - Any dialysis(kidney only), or any recent transplants
  - How about any asthma, COPD or emphysema? Any oxygen use?
  - Any Sleep Apnea? 
      
      - If yes, do you use a C-PAP machine?
  - Any Arthritis?
      
      - Is it osteo or rheumatoid?
  - Any thyroid issues?
      
      - Is it hypo or hyper? Diagnosis age? 
  - Any heart arrhythmia, or any other heart related conditions?
      
      - Pacemaker or defibrillator?
  - Any Hypertension or cholesterol issues?
      
      - If yes, how many medications for each?
  - What is your height and weight?
      
      - If too skinny or too big, type height/weight in toolkit
  - Any DUI’s, felonies, probation or parole?
      
      - If yes, when?`,
  },
  {
    id: "loan-forgiveness",
    order: 11,
    title: "Loan Forgiveness",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Loan Forgiveness",
    body: `# **LOAN FORGIVENESS ANGLE**

Post Hold Process — Cash Value / Surrender Option

# **STEP 1 — Reassure the Original Problem**

### **SCRIPT**

“Alright ___, are you still with me?” 

→ “Perfect.”

“Definitely going to help you out with ______ so that way you know exactly what is going on moving forward.” 

### **PURPOSE**

This reassures the caller that their original reason for calling is still being handled before moving forward with the policy review.

# **STEP 2 — Create Curiosity & Concern**

### SCRIPT

“But I'm seeing some confusing and concerning things on my end.”

“Has it been awhile since you last talked to an agent?”

→ Listen to the client’s response.

“When you took out this policy did you have any major health concerns?”

Use reactions:

• “Really none?”  
• “Oh that's it?”  
• “Only that?”

### **PURPOSE**

This step captures the client's attention and creates curiosity so they are ready to listen to what the agent discovered.

# **STEP 3 — Insert the Angle (Cash Surrender)**

### **SCRIPT**

“Were you aware that the loan balance on your life policy insurance policy is eating away at the death benefit and the interest is getting added on top of that as well?”

**(pause 3 seconds)**

**“Did anyone ever explain that to you?”**

**(Wait for client response…)**

“So….that loan is eating away your policy, and If that loan doesn’t get paid back soon, the interest keeps adding up making it harder and harder to pay it all back.”

Once they say they had no idea, continue:

“It is actually showing here that **one of our preferred carriers like (Carrier Name)** had sent you an option to forgive the loan, so you don’t have to pay it back, while continuing to **have life insurance in place still to take care of your family.** 

# **STEP 4 — Assign Responsibility**

### **SCRIPT**

“It looks like they were trying to reach out to you to get that fixed.”

“Why in the world did you not do that when you had the chance?”

  

# **STEP 5 — Align With the Client (Coddling Stage)**

### **SCRIPT**

“It’s not your fault. You did nothing wrong. This should have been explained to you.”

“Someone definitely dropped the ball here.”

### **PURPOSE**

This step aligns the agent with the client and shows empathy after the problem has been revealed.

# **STEP 6 — Assumption Agreement**

### **SCRIPT**

“Well ***, I'm assuming if you knew you could have **received a tax-free check for around $*** and still kept your life insurance in place, you probably would have done that right?” 

→ Wait for response:

• “Absolutely”  
• “Yes”  
• “Definitely”

### **PURPOSE**

This gets the client to verbally agree that correcting the situation would have been the right decision.

# **STEP 7 — Takeaway Close**

### **SCRIPT**

“Well since they sent that out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could **go to bat for you** and reinstate what should have been explained to you by your previous agent since you had no idea, AND help you with (reason they are calling) as well.”

### **PURPOSE**

This creates urgency and positions the agent as the client’s advocate while transitioning directly into the application process. 

  

# **STEP 8 — Verify Health and eApplication**

So as you’re probably aware, this will depend on your age and health, so I do need to ask you a few questions regarding your health….

  

  - Are you a smoker/non-smoker?
  - Any history of heart attack, cancer, stroke or diabetes?
      
      - If yes to any of these, ask more follow up questions, such as:
      - When was the diagnosis? What type of cancer and date of last treatment? Was it a regular stroke or mini-stroke?
      - If yes to diabetes, when were you diagnosed? Any complications such as neuropathy, retinopathy or amputations? Oral medications, insulin or both? 
  - Any kidney/liver failure or disease? 
      
      - If yes to kidney failure/disease, ask those follow up questions. 
      - Any dialysis(kidney only)
  - Any asthma, COPD or emphysema? Any oxygen use?
  - Sleep Apnea? 
      
      - If yes, do you use a C-PAP machine?
  - Arthritis?
      
      - Is it osteo or rheumatoid?
  - Any thyroid issues?
      
      - Is it hypo or hyper? Diagnosis age? 
  - Any heart arrhythmia, or any other heart related conditions?
      
      - Pacemaker or defibrillator?
  - Hypertension or cholesterol issues?
      
      - If yes, how many medications for each?
  - Height/Weight?
      
      - If too skinny or too big, type height/weight in toolkit
  - Any DUI’s, felonies, probation or parole?
      
      - If yes, when?`,
  },
  {
    id: "death-claim-extension",
    order: 12,
    title: "Death Claim Extension",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Death Claim Extension",
    body: `# **DEATH CLAIM EXTENSION ANGLE**

Post Hold Process — Death Claim Department Scenario

# **STEP 1 — Reassure the Original Problem (Expanded)**

### **SCRIPT**

“I’m very sorry you’re having to do this.”

“Have you ever filed a **death claim** before?”

→ Pause and listen.

“Do you have the **death certificate**?”

→ Pause.

“Okay, so what I’m going to have to do is get you over to the **death claims department**.”

“They are going to tell you **who the beneficiary is**, **how much the policy is worth**, and most importantly **whether the policy was active when (NAME) passed away**.”

### **PURPOSE**

This step establishes the seriousness of the situation and frames the conversation around the **death benefit payout**.

Mentioning the **death certificate, beneficiary, and active policy status** prepares the caller to think about whether the claim will actually pay out.

# **STEP 2 — Create Curiosity & Concern**

### **SCRIPT**

“But I am seeing **some confusing and concerning things on my end**.”

→ Pause.

“When **(Deceased Name)** took out this policy, did you ever talk to them about it?”

→ Listen.

“When was the **last time you talked to their agent about this**?”

→ Listen carefully.

### **PURPOSE**

These questions establish that the caller likely **does not fully understand the policy details** and has **not recently spoken with an agent** about the policy.

This prepares the caller to hear that **something may not have been properly set up**.

# **STEP 3 — Insert the Angle (Death Claim Extension)**

### **SCRIPT**

“It actually looks like there was an **extension of benefits on the policy** that would have allowed **you** to take out life insurance on yourself with a preferred carrier in our network.”

“This would have taken care of your **funeral and final expenses**, and it would have covered you for **$___ in coverage for around $___ per month**.”

→ Pause.

“Typically for someone in **your age category**, that rate would normally be **about $50 higher** than that.” 

  

### **PURPOSE**

This introduces a **missed opportunity** tied to the death claim.

The caller now believes they may have had the chance to:

• Secure their own **life insurance protection****  
** • Lock in a **discounted premium****  
** • Protect their family from **funeral and final expenses**

This creates both **value and regret**, which prepares the caller for the emotional step that follows.

# **STEP 4 — Assign Responsibility**

### SCRIPT

“Why in the world did you not go ahead and set that up when you had the chance?”

→ Pause and listen.

### **PURPOSE**

This step creates emotional engagement by suggesting the opportunity **could have already been handled**.

Most callers will respond with confusion or frustration, which opens the door for the agent to move into the next step.

# **STEP 5 — Align With the Client (Coddling Stage)**

### **SCRIPT**

“Oh my gosh ___, I am so sorry this happened.”

“Someone definitely dropped the ball here.”

“Because that definitely should have been explained to you.” 

### **PURPOSE**

This step releases the tension created in the blame step and positions the agent as the person **helping fix the situation**.

# **STEP 6 — Assumption Agreement**

### **SCRIPT**

“Well ___, I’m assuming if you knew you could have **locked in your own life insurance coverage**, and had your **funeral and final expenses taken care of**, you probably would have gone ahead and set that up, right?”

→ Wait for response:

• “Yes”  
 • “Absolutely”  
 • “Definitely”

### **PURPOSE**

This gets the caller to **verbally agree** that taking the offer would have been the right decision.

# **STEP 7 — Takeaway Close**

### **SCRIPT**

“Well since they sent that out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could **go to war for you** and reinstate what should have happened since you had no idea, AND help you with (reason they are calling) as well.”

→ Transition directly into the **application**.

  

# **STEP 8 — Verify Health and eApplication**

So as you’re probably aware, this will depend on your age and health, so I do need to ask you a few questions regarding your health….

  

  - Are you a smoker/non-smoker?
  - Any history of heart attack, cancer, stroke or diabetes?
      
      - If yes to any of these, ask more follow up questions, such as:
      - When was the diagnosis? What type of cancer and date of last treatment? Was it a regular stroke or mini-stroke?
      - If yes to diabetes, when were you diagnosed? Any complications such as neuropathy, retinopathy or amputations? Oral medications, insulin or both? 
  - Any kidney/liver failure or disease? 
      
      - If yes to kidney failure/disease, ask those follow up questions. 
      - Any dialysis(kidney only)
  - Any asthma, COPD or emphysema? Any oxygen use?
  - Sleep Apnea? 
      
      - If yes, do you use a C-PAP machine?
  - Arthritis?
      
      - Is it osteo or rheumatoid?
  - Any thyroid issues?
      
      - Is it hypo or hyper? Diagnosis age? 
  - Any heart arrhythmia, or any other heart related conditions?
      
      - Pacemaker or defibrillator?
  - Hypertension or cholesterol issues?
      
      - If yes, how many medications for each?
  - Height/Weight?
      
      - If too skinny or too big, type height/weight in toolkit
  - Any DUI’s, felonies, probation or parole?
      
      - If yes, when?`,
  },
  {
    id: "non-insurance-extension",
    order: 13,
    title: "Non Insurance Extension",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Non Insurance Extension",
    body: `# **NON-LIFE INSURANCE EXTENSION ANGLE**

Post Hold Process — Non-Life Insurance Benefit Activation

# **STEP 1 — Reassure the Original Problem**

### SCRIPT

“Alright ___, are you still with me?”

→ “Perfect.”

“Definitely going to help you out with ______ so that way you know exactly what is going on moving forward.” 

### *PURPOSE*

### *This reassures the caller that their original reason for calling is being handled before moving into the policy review.*

# **STEP 2 — Create Curiosity & Concern**

### SCRIPT

“But I'm seeing some **confusing and concerning things on my end**.”

“When was the **last time you talked to an agent about this policy**?” 

→ Listen.

“When you originally set this up, it doesn’t look like you activated the death benefits on there for when you pass away?”

→ Listen.

### *PURPOSE*

*These questions establish that the caller may not fully understand how their policy works, preparing them to hear that something may not have been properly set up.*

# **STEP 3 — Insert the Angle (Non-Life Insurance Extension)**

### SCRIPT

“It’s actually showing here that **you have not activated all of your benefits**.”

“It’s showing you also could have **set up a death benefit on top of all the other insurance you already had**, and it would have been at a **preferred rate**.”

“You could have had **$___ in coverage for only $___ per month**.”

→ Pause.

“Typically for someone in **your age category**, that would normally be **about $50 higher than that**.”

***PURPOSE***

*This angle introduces the idea that the caller* ***did not activate all of the benefits available to them****.*

*The caller now believes they may have had the opportunity to:*

*• Add* ***additional life insurance protection******  
****• Lock in a* ***discounted premium******  
****• Stack additional coverage* ***on top of their existing insurance***

*This creates the feeling that* ***an opportunity may have been missed****, setting up the emotional response needed for the next step.*

# **STEP 4 — Assign Responsibility**

### SCRIPT

“Why in the world did you not go ahead and set that up when you had the chance?”

→ Pause and listen.

### *PURPOSE*

*This step creates emotional engagement by suggesting the opportunity* ***could have already been handled****.*

*Most callers will respond with confusion or frustration, allowing the agent to move to the next step.*

  
  

# **STEP 5 — Align With the Client (Coddling Stage)**

### SCRIPT

“Oh my gosh ___, I am so sorry this happened.” 

“Someone definitely dropped the ball here.”

“Because that definitely should have been explained to you.” 

### ***PURPOSE***

*This step releases the tension created during the blame step and positions the agent as the person* ***helping correct the issue****.*

# **STEP 6 — Assumption Agreement**

### SCRIPT

“Well ***, I’m assuming if you knew you could have **added $*** in additional coverage at that discounted rate**, you probably would have gone ahead and set that up, right?”

→ Wait for response:

• Yes  
• Absolutely  
• Definitely

### ***PURPOSE***

*This step gets the caller to* ***verbally agree*** *that activating the benefit would have been the correct decision.*

*Once they say yes, they psychologically* ***commit to the solution****.*

**STEP 7 — Takeaway Close**

### SCRIPT

“Well since they sent that out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could **go to war for you** and reinstate what should have happened since you had no idea, AND help you with (reason they are calling) as well.”

→ Transition directly into the **application process**.

  

# **STEP 8 — Verify Health and eApplication**

So as you’re probably aware, this will depend on your age and health, so I do need to ask you a few questions regarding your health….

  

  - Are you a smoker/non-smoker?
  - Any history of heart attack, cancer, stroke or diabetes?
      
      - If yes to any of these, ask more follow up questions, such as:
      - When was the diagnosis? What type of cancer and date of last treatment? Was it a regular stroke or mini-stroke?
      - If yes to diabetes, when were you diagnosed? Any complications such as neuropathy, retinopathy or amputations? Oral medications, insulin or both? 
  - Any kidney/liver failure or disease? 
      
      - If yes to kidney failure/disease, ask those follow up questions. 
      - Any dialysis(kidney only)
  - Any asthma, COPD or emphysema? Any oxygen use?
  - Sleep Apnea? 
      
      - If yes, do you use a C-PAP machine?
  - Arthritis?
      
      - Is it osteo or rheumatoid?
  - Any thyroid issues?
      
      - Is it hypo or hyper? Diagnosis age? 
  - Any heart arrhythmia, or any other heart related conditions?
      
      - Pacemaker or defibrillator?
  - Hypertension or cholesterol issues?
      
      - If yes, how many medications for each?
  - Height/Weight?
      
      - If too skinny or too big, type height/weight in toolkit
  - Any DUI’s, felonies, probation or parole?
      
      - If yes, when?`,
  },
  {
    id: "consolidation",
    order: 14,
    title: "Consolidation",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Consolidation",
    body: `# **STEP 1 — Reassure the Original Problem**

### **SCRIPT**

“Alright ___, are you still with me?”

→ “Perfect.”

“Definitely going to help you out with ______ so that way you know exactly what is going on moving forward.”

### **PURPOSE**

This reassures the caller that their original issue is being handled before moving into the policy review.

# **STEP 2 — Create Curiosity & Concern**

### **SCRIPT**

“But I'm seeing some **confusing and concerning things on my end**.”

“When was the **last time you talked to an agent about these policies**?”

→ Listen.

“When you originally set these up, did anyone ever explain **how they were supposed to work together long term**?”

→ Listen.

### **PURPOSE**

These questions establish that the caller may **not fully understand how their policies work together**, preparing them to hear that something **may not be structured correctly**.

# **STEP 3 — Insert the Angle (Consolidation)**

### **SCRIPT**

“It actually looks like you currently have **multiple life insurance policies through different companies**.”

“What most people don’t realize is that when policies are **spread across multiple companies**, it can actually make things **much more difficult on the family when the time comes to file a claim**.”

“Instead of filing **one claim**, they end up having to **contact multiple insurance companies, submit multiple death certificates, and go through several different claims processes**.”

→ Pause.

  

“It’s showing here that **one of our preferred carriers like (Carrier Name)** had actually sent an option to **consolidate those policies into one plan**.”

“That way your family would only have to **file one claim with one company**, instead of dealing with multiple carriers.”

“You could have had **$___ in total coverage for around $___ per month**.”

### **PURPOSE**

This angle introduces two key concerns:

• **Making things easier for the family when a claim is filed****  
**• **Avoiding inefficiencies from having multiple policies**

The caller now believes they may have been able to:

• Simplify their coverage into **one policy****  
**• Make the **claims process easier for their family****  
**• Potentially **pay less for the same protection**

This creates emotional engagement while keeping the focus on **protecting the family**.

# **STEP 4 — Assign Responsibility**

### **SCRIPT**

“Why in the world did you not go ahead and take care of that when you had the chance?”

→ Pause and listen.

### **PURPOSE**

This step creates emotional engagement by suggesting the opportunity **could have already been handled**.

Most callers will respond with confusion or frustration, allowing the agent to move to the next step.

# **STEP 5 — Align With the Client (Coddling Stage)**

### **SCRIPT**

“Oh my gosh ___, I am so sorry this happened.”

“Someone definitely dropped the ball here.”

“Because that definitely should have been explained to you.”

### **PURPOSE**

This step releases the tension created during the blame stage and positions the agent as the person **helping correct the situation**.

# **STEP 6 — Assumption Agreement**

### **SCRIPT**

“Well ___, I’m assuming if you knew you could have **combined those policies so your family would only have to file one claim instead of dealing with multiple insurance companies**, you probably would have gone ahead and set that up, right?”

→ Wait for response:

• Yes  
 • Absolutely  
 • Definitely

### **PURPOSE**

This step gets the caller to **verbally agree** that consolidating the coverage would have been the correct decision.

# **STEP 7 — Takeaway Close**

### **SCRIPT**

“Well since they sent that out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could **go to war for you** and reinstate what should have happened since you had no idea, AND help you with (reason they are calling) as well.”

→ Transition directly into the **application process**.

### **PURPOSE**

The takeaway creates urgency by suggesting the opportunity **may no longer be available**, while positioning the agent as the person who will **fight to fix the situation**.`,
  },
  {
    id: "work-policy",
    order: 15,
    title: "Work Policy",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Work Policy",
    body: `# **WORK POLICY ANGLE**

Post Hold Process — Work Policy Scenario

# **STEP 1 — Reassure the Original Problem**

### **SCRIPT**

“Alright ___, are you still with me?”

→ “Perfect.”

“Definitely going to help you out with your **work policy**, so that way you know exactly what is going on moving forward.”

### **PURPOSE**

Reassures the caller that you can help with their **work-related coverage** before transitioning into the review.

# **STEP 2 — Create Curiosity & Concern (Work Policy Specific)**

### **SCRIPT**

“But I am seeing **some confusing and concerning things on my end**.”

→ Pause.

“When was the **last time you talked to an agent about the benefits at work**?”

→ Listen.

Follow up:

“When you first started working there, did you have any **major health concerns at that time**?”

→ Listen carefully.

### **PURPOSE**

These questions establish:

• The client likely **has not reviewed their benefits recently****  
** • They may have originally qualified at a **better health rating****  
** • There may have been an opportunity to **lock in better coverage**

# **STEP 3 — Insert the Angle (Work Policy)**

### **SCRIPT**

“So were you aware that the **type of policy you are in will actually expire on you once you are done working**?”

→ Pause and listen.

Once they say no:

“A work policy is only **covering you while you are working**, and not **outside of the workplace**.”

→ Pause.

“So if you ever **leave that job, get laid off, or retire**, that coverage **does not go with you**.”

→ Pause.

“It is actually showing here that **one of our partners like (Carrier Name)** had noticed this, and had tried to reach out to you about setting up a **permanent policy**…”

“…one that would **cover you both inside and outside of work**, and would **never expire when you retire from your job**.”

→ Pause and listen.

### **PURPOSE**

This angle creates three realizations:

• Coverage is **temporary****  
** • It does **not follow them long-term****  
** • It does **not fully protect them outside of work**

Then introduces the solution:

ð A policy they **own and keep permanently**

# **STEP 4 — Assign Responsibility**

### **SCRIPT**

“Why in the world did you not go ahead and set that up when you had the chance?”

→ Pause and listen.

### **PURPOSE**

Creates emotional engagement by suggesting the opportunity **was already available**.

# **STEP 5 — Align With the Client (Coddling Stage)**

### **SCRIPT**

“Oh my gosh ___, I am so sorry this happened.”

“Someone definitely dropped the ball here.”

“Because that definitely should have been explained to you.”

### **PURPOSE**

Releases tension and positions the agent as the person **helping fix the situation**.

# **STEP 6 — Assumption Agreement**

### **SCRIPT**

“Well ___, I’m assuming if you knew that your **work coverage would not follow you**, and that you could have something **permanent that you actually own**, you probably would have gone ahead and set that up, right?”

→ Wait for response:

• Yes  
 • Absolutely  
 • Definitely

### **PURPOSE**

Gets the client to **verbally agree** that permanent coverage is the better option.

# **STEP 7 — Takeaway Close**

### **SCRIPT**

“Well since they sent that out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could **go to war for you** and reinstate what should have happened since you had no idea, AND help you with (reason they are calling) as well.”

→ **Application**`,
  },
  {
    id: "quote-shopper-angle",
    order: 16,
    title: "Quote Shopper Angle",
    phase: "Post Hold Process",
    status: "draft_compliance_review",
    sourceTab: "Quote Shopper Angle",
    body: `# **QUOTE SHOPPER ANGLE**

Post Hold Process — Quote Shopper Scenario

# **STEP 1 — Reassure**

### SCRIPT

“Alright ___, are you still with me?” → “Perfect.”

“So I did go ahead and take a look at everything on my end.”

### *PURPOSE*

*Reconnect with the caller after the hold and prepare them to hear the quote information.*

  

# **STEP 2 — Confirm Coverage They Were Looking For**

### SCRIPT

“So based on what you told me earlier, you were looking to set up about **$___ in coverage**, mainly to take care of **(what they told you earlier — family protection, funeral expenses, mortgage, etc.)**.”

“And looking through **all the carriers available in your state**, that amount of coverage would come out to **around $___ per month**.”

→ Pause.

### *PURPOSE*

*This step confirms that you understood the caller’s coverage goal and establishes credibility by showing that you checked all available carriers.*

# **STEP 3 — Create Curiosity & Concern**

### SCRIPT

“But I am seeing **some confusing and concerning things on my end**.”

→ Pause.

“Have you ever **filled out a life insurance request before**?”

→ Listen.

### *PURPOSE*

*This question establishes that the caller may have submitted requests previously, preparing them to hear that an offer may have already been available.*

# **STEP 4 — Insert the Angle (Quote Shopper / Preferred Rate)**

### SCRIPT

“It’s actually showing here that **one of our top carriers like (Carrier Name)** was going to let you have **that same coverage for about $80 less per month**.”

  

“Why in the world did you not go ahead and **set up the preferred rate when they sent that out to you**?”

→ Pause and listen.

### *PURPOSE*

*This angle introduces the idea that the caller may have missed the opportunity to lock in a preferred rate.*

*The caller now believes they may have been able to:*

*• Secure the same coverage**  
* *• Pay significantly less per month**  
* *• Lock in the preferred rate*

*This creates emotional engagement before moving into the next step.*

# **STEP 5 — Align With the Client (Coddle)**

### SCRIPT

“Oh my gosh ___, I am so sorry this happened.”

“Someone definitely dropped the ball here.”

“Because that definitely should have been explained to you.”

  

### *PURPOSE*

*This step releases the tension created in the blame stage and positions the agent as the person helping correct the issue.*

# **STEP 6 — Assumption Agreement**

### SCRIPT

“Well ___, I’m assuming if you knew you could have **had that same coverage for about $80 less per month**, you probably would have gone ahead and set that up, right?”

→ Wait for clients response.

### ***PURPOSE***

*Gets the caller to* ***verbally agree*** *that locking in the lower rate would have been the correct decision.*

# **STEP 7 — Takeaway Close**

### SCRIPT

“Well since they sent that out a long time ago ___, I’m not even quite sure they will still let you do it.”

“But let me see if I could **go to war for you** and reinstate what should have happened since you had no idea.”

→ **Application**`,
  },
  {
    id: "three-option-close",
    order: 17,
    title: "Three Option Close",
    phase: "Application Process",
    status: "draft_compliance_review",
    sourceTab: "Three Option Close",
    body: `# **THREE OPTION CLOSE**

Application Process — Mid Application Coverage Selection

# **STEP 1 — Frame the Decision**

### **SCRIPT**

“So I’ve got some **good news and some bad news for you**.”

→ Pause.

“The **good news** is you actually got **pre-approved for up to $40,000 in coverage**.”

“Sounds like your health is actually **pretty good**.”

→ Pause.

“The **bad news** is I’m going to be your **personal life insurance agent for the rest of your life**.”

*(light tone)*

# **STEP 2 — Reinforce the Coverage Goal**

### **SCRIPT**

“So we already know that we’re (**angle Insert)**

# **STEP 3 — Introduce the Upgrade Opportunity**

### **SCRIPT**

“So I was able to **get the other options pulled up on my end**.”

  

Pitch the first option that is keeping their coverage, or price the same

  

“Now you are the **youngest and healthiest you are ever going to be**, which means life insurance will be **the cheapest right now**.”

“So if you were ever thinking about **upgrading your coverage**, now would be the time to do it since it will be **the lowest price you will ever see**.”

→ Pause.

# **STEP 4 — Present the Three Options**

### **SCRIPT**

I am seeing the **other options they sent out as well**.”

“They sent you out:

**Option A** for **$___ in coverage for $___ per month**.”

**Option B** for **$___ in coverage for $___ per month**.”

**Option C** for **$___ in coverage for $___ per month**.”

→ Pause.

# **STEP 5 — Decision Question**

### **SCRIPT**

“If you had seen **any of these options earlier**, which one would have made the **most sense for you and your family**?”

→ Listen.

# **STEP 6 — Price Objection Recovery**

*(If the client says the options are too expensive.)*

### **SCRIPT**

“No problem.”

We will just go ahead and, (adjust per the angle of the call)

  

### **PURPOSE**

This removes the price objection by bringing the client back to **a payment they already said was affordable earlier in the call**.

# **STEP 7 — Reinstatement Transition**

### **SCRIPT**

“Perfect.”

“Let me see if I can **reinstate that for you**.”`,
  },
  {
    id: "billing-page",
    order: 18,
    title: "Billing page",
    phase: "Application Process",
    status: "draft_compliance_review",
    sourceTab: "Billing page",
    body: `# **BILLING PAGE**

Application Process — Payment Verification & Draft Setup

# **STEP 1 — Introduce Billing Verification**

### **SCRIPT**

“I was **not the initial underwriting agent on your policy**, so I just need to go ahead and **verify the routing and account number**.”

→ Pause.

### **PURPOSE**

This frames the request as a **verification step**, not as asking for banking information from scratch.

This reduces suspicion and keeps the process feeling **procedural and normal**.

# **STEP 2 — Handle Banking Hesitation**

*(If the client says they are uncomfortable providing their banking information.)*

### **SCRIPT**

“No worries.”

“I can actually **verify your routing number and make sure we have the correct one on file**.”

“What is the **name of your financial institution**?”

→ Proceed with verification.

### **PURPOSE**

This reassures the client that the process is **secure** and that you are simply verifying the information.

# **STEP 3 — Handle Timing Objection**

*(If the client says they cannot have the payment drafted right now.)*

### **SCRIPT**

“No worries.”

“What is the **best time of the month** to have this come out of your account?”

→ Adjust the billing date accordingly.

### **PURPOSE**

This removes the objection by allowing the client to **choose the billing timing**, rather than stopping the application.

# **STEP 4 — Standard Billing Confirmation**

*(If the client provides their banking information without hesitation.)*

### **SCRIPT**

“Okay ___.”

“Typically these policies **are drafted within 24 to 48 hours** to make sure you are **immediately protected**.”

“God forbid you were to **pass away next week**, the policy would **pay out to ___ (beneficiary name)**.”

→ Pause.

“After that it would just be **recurring each month on the date of the application**.”

“Is that **comfortable for you now and in the future**?”

### **PURPOSE**

This step:

• Reinforces **immediate protection****  
** • Connects the payment directly to **beneficiary protection****  
** • Confirms that the billing setup works **long-term**

# **STEP 5 — Continue the Application**

### **SCRIPT**

“Perfect.”

“Let’s go ahead and **finish getting everything submitted for you**.”

### **PURPOSE**

This keeps the process moving forward toward **final submission of the policy**.`,
  },
];
