# Architecture Audit and Implementation Plan Prompt for Lovable

I need you to conduct a thorough audit of our CTRM (Commodity Trading and Risk Management) system's current architecture and create a phased implementation plan to align it with our target architecture. Below is the process I'd like you to follow:

## Phase 1: Current Architecture Audit

Please analyze our current codebase and database schema to understand the existing architecture. Focus on the following aspects:

1. **Project Structure Analysis**:
   - Examine the current folder organization and module boundaries
   - Identify how components, hooks, services, and types are currently organized
   - Map out the current data flow between different parts of the application

2. **Database Schema Analysis**:
   - Analyze the Supabase schema structure
   - Identify entity relationships and data models
   - Determine if the schema supports all required business functionality
   - Check for missing tables or fields needed for the complete trade lifecycle

3. **State Management Assessment**:
   - Evaluate how server state is currently managed
   - Analyze client-side state management approaches
   - Assess form state handling

4. **UI Component Organization**:
   - Review component hierarchy and organization
   - Analyze component reusability and composition patterns
   - Check for consistent styling and UI patterns

5. **API Design Assessment**:
   - Examine how Supabase is integrated
   - Review service abstractions and data access patterns
   - Analyze error handling approaches

## Phase 2: Gap Analysis

Compare the current architecture with the target architecture described in the provided System Architecture Document. Identify gaps and areas for improvement in:

1. **Module Organization**:
   - Does the code follow a modular structure aligned with business domains?
   - Are module boundaries clear and well-defined?
   - Is there proper separation of concerns?

2. **Database Schema**:
   - Does the schema support all required business entities?
   - Are relationships properly defined?
   - Are there missing tables or fields needed for the complete trade lifecycle?

3. **State Management**:
   - Is React Query used effectively for server state?
   - Is client state properly managed?
   - Are forms handled consistently?

4. **Component Organization**:
   - Does the UI follow a consistent component hierarchy?
   - Are components properly sized and focused?
   - Is there unnecessary duplication?

5. **API Design**:
   - Are there proper service abstractions?
   - Is error handling consistent?
   - Is there a clear data transformation strategy?

## Phase 3: Implementation Plan

Based on your analysis, create a detailed, phased implementation plan to migrate from the current architecture to the target architecture. The plan should:

1. **Begin with Schema Updates**:
   - Define necessary database schema changes
   - Create SQL migration scripts for new tables and fields
   - Outline data migration approach for existing data

2. **Outline Codebase Restructuring**:
   - Provide a step-by-step approach to reorganize the codebase
   - Prioritize changes based on impact and dependencies
   - Include specific file and folder moves/renames

3. **Define Module Implementation Order**:
   - Determine the logical sequence for implementing/refactoring modules
   - Consider dependencies between modules
   - Balance technical debt reduction with new feature development

4. **Include Specific Implementation Details**:
   - Provide concrete code examples for key patterns
   - Include TypeScript interfaces for new entities
   - Define specific service functions and hooks

5. **Establish Testing Strategy**:
   - Outline how to test changes without disrupting existing functionality
   - Define test coverage requirements
   - Include regression testing approach

## Phase 4: Timeline and Resources

Provide a realistic timeline for the implementation plan:

1. **Phase Breakdown**:
   - Divide the work into 2-week sprints
   - Define clear deliverables for each sprint
   - Identify dependencies between sprints

2. **Resource Requirements**:
   - Estimate development effort required
   - Identify specialized skills needed
   - Highlight areas that may require additional expertise

## Phase 5: Risk Assessment and Mitigation

Identify potential risks in the implementation and provide mitigation strategies:

1. **Technical Risks**:
   - Data migration challenges
   - Performance impacts
   - Integration issues

2. **Business Risks**:
   - Functional disruptions
   - Timeline delays
   - User adoption challenges

## Additional Guidelines

1. **Maintain Existing Functionality**:
   - Ensure all current features continue to work during migration
   - Prioritize backward compatibility
   - Focus on incremental improvements

2. **Follow Best Practices**:
   - Adhere to TypeScript best practices
   - Maintain consistent styling with Tailwind CSS
   - Use shadcn/ui components where appropriate

3. **Documentation**:
   - Document architectural changes
   - Create migration guides for developers
   - Update component documentation

Please conduct this audit and create a comprehensive implementation plan based on the System Architecture Document I've provided. The goal is to achieve a well-structured modular monolith that supports the complete trade lifecycle from entry through operations, finance, and reporting.
