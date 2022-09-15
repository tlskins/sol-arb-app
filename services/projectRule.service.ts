import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ProjectRule, UpsertProjectRule, ProjectStat } from '../types/projectRules'

interface ProjectRulesResp {
  projectRules: ProjectRule[]
}

interface ProjectRuleResp {
  projectRule: ProjectRule
}

interface ProjectStatsResp {
  projectStats: ProjectStat
}

interface ProjectsResp {
  projects: ProjectStat[]
}

interface ProfileStatsResp {
  profileStats: ProjectRule[]
}

class ProjectRuleService {
  newProjectRule = (): ProjectRule => {
    return {
      _id: "",
      discordId: "",
      projectId: "",
      active: true,
      fixedPriceChange: 5,
    } as ProjectRule
  }

  getRule = async (id: string): Promise<ProjectRule | undefined> => {
    try {
      const resp: IResponse<ProjectRuleResp> = await http.get( `project-rule/${ id }` )
      
      return resp.data.projectRule
    } catch( err ) {
      handleError("Error getting project rule", err)
    }
  }

  getRulesByDiscord = async (): Promise<ProjectRule[] | undefined> => {
    try {
      const resp: IResponse<ProjectRulesResp> = await http.get( `project-rule` )

      return resp.data.projectRules
    } catch( err ) {
      handleError("Error getting project rules", err)
    }
  }

  getProjectStats = async (projId: string): Promise<ProjectStat | undefined> => {
    try {
      const resp: IResponse<ProjectStatsResp> = await http.get( `project-stats/${ projId }` )
      
      return resp.data.projectStats
    } catch( err ) {
      handleError("Error getting project stats", err)
    }
  }

  searchProjects = async (search: string): Promise<ProjectStat[] | undefined> => {
    try {
      const resp: IResponse<ProjectsResp> = await http.get( `projects`, { params: { search }} )
      
      return resp.data.projects
    } catch( err ) {
      handleError("Error searching projects", err)
    }
  }

  getProfileStats = async (): Promise<ProjectRule[] | undefined> => {
    try {
      const resp: IResponse<ProfileStatsResp> = await http.get( `project-stats` )
      
      return resp.data.profileStats
    } catch( err ) {
      handleError("Error getting profile stats", err)
    }
  }

  createRule = async ( rule: ProjectRule ): Promise<ProjectRule | undefined> => {
    try {
      const resp: IResponse<ProjectRule> = await http.post( `project-rule`, {
        projectId: rule.projectId,
        active: rule.active,
        fixedPriceChange: rule.fixedPriceChange,
      } )

      return resp.data
    } catch( err ) {
      handleError("Error creating project rule", err)
    }
  }

  updateRule = async ( id: string, update: UpsertProjectRule ): Promise<ProjectRule | undefined> => {
    try {
      const resp: IResponse<ProjectRule> = await http.put( `project-rule/${ id }`, {
        active: update.active,
        fixedPriceChange: update.fixedPriceChange,
      } )

      return resp.data
    } catch( err ) {
      handleError("Error updating project rule", err)
    }
  }
}

export default new ProjectRuleService()
